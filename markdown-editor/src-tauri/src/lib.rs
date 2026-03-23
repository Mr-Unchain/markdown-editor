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
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
