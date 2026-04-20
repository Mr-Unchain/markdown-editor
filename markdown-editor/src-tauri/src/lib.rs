use argon2::Argon2;
use base64::engine::general_purpose::STANDARD_NO_PAD;
use base64::Engine;
use rand::rngs::OsRng;
use rand::RngCore;
use serde::Serialize;

const KEYRING_SERVICE: &str = "markdown-editor";
const KEYRING_ACCOUNT: &str = "vault-master-secret";
const VAULT_SECRET_VERSION: &str = "v1";

#[derive(Serialize)]
struct VaultPasswordPayload {
    password: String,
}

#[tauri::command]
fn get_or_create_vault_password() -> Result<VaultPasswordPayload, String> {
    let (secret, salt) = load_or_create_vault_material()?;
    let mut key = vec![0u8; 32];

    Argon2::default()
        .hash_password_into(secret.as_bytes(), &salt, &mut key)
        .map_err(|e| format!("KDF failed: {e}"))?;

    Ok(VaultPasswordPayload {
        password: STANDARD_NO_PAD.encode(key),
    })
}

fn load_or_create_vault_material() -> Result<(String, Vec<u8>), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("failed to initialize keyring entry: {e}"))?;

    match entry.get_password() {
        Ok(raw) => parse_vault_material(&raw),
        Err(_) => {
            let mut secret = [0u8; 32];
            let mut salt = [0u8; 16];
            OsRng.fill_bytes(&mut secret);
            OsRng.fill_bytes(&mut salt);

            let encoded_secret = STANDARD_NO_PAD.encode(secret);
            let encoded_salt = STANDARD_NO_PAD.encode(salt);
            let payload = format!(
                "{}:{}:{}",
                VAULT_SECRET_VERSION,
                encoded_secret,
                encoded_salt
            );

            entry
                .set_password(&payload)
                .map_err(|e| format!("failed to persist vault secret: {e}"))?;

            Ok((encoded_secret, salt.to_vec()))
        }
    }
}

fn parse_vault_material(raw: &str) -> Result<(String, Vec<u8>), String> {
    let mut parts = raw.split(':');
    let version = parts.next().ok_or_else(|| "missing version".to_string())?;
    let secret = parts.next().ok_or_else(|| "missing secret".to_string())?;
    let salt_b64 = parts.next().ok_or_else(|| "missing salt".to_string())?;

    if version != VAULT_SECRET_VERSION {
        return Err(format!("unsupported keyring material version: {version}"));
    }

    let salt = STANDARD_NO_PAD
        .decode(salt_b64)
        .map_err(|e| format!("invalid salt encoding: {e}"))?;

    if salt.is_empty() {
        return Err("salt must not be empty".to_string());
    }

    Ok((secret.to_string(), salt))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                use argon2::Argon2;
                let argon2 = Argon2::default();
                let salt = b"markdown-editor-stronghold!!";
                let mut key = vec![0u8; 32];
                argon2
                    .hash_password_into(password.as_ref(), salt, &mut key)
                    .expect("failed to hash password");
                key
            })
            .build(),
        )
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![get_or_create_vault_password])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
