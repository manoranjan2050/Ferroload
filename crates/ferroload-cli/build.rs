use std::process::Command;
use std::path::PathBuf;

fn main() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let web_dir = manifest_dir.join("../../web");

    // Only build if web/dist doesn't exist or source changed
    if web_dir.exists() {
        println!("cargo:rerun-if-changed=../../web/src");
        println!("cargo:rerun-if-changed=../../web/index.html");
        println!("cargo:rerun-if-changed=../../web/package.json");

        let dist = web_dir.join("dist");
        if !dist.exists() {
            // npm install
            let npm_install = if cfg!(target_os = "windows") {
                Command::new("cmd").args(["/C", "npm", "install"]).current_dir(&web_dir).status()
            } else {
                Command::new("npm").args(["install"]).current_dir(&web_dir).status()
            };

            if let Ok(status) = npm_install {
                if !status.success() {
                    println!("cargo:warning=npm install failed, frontend will not be embedded");
                    return;
                }
            }

            // npm run build
            let npm_build = if cfg!(target_os = "windows") {
                Command::new("cmd").args(["/C", "npm", "run", "build"]).current_dir(&web_dir).status()
            } else {
                Command::new("npm").args(["run", "build"]).current_dir(&web_dir).status()
            };

            if let Ok(status) = npm_build {
                if !status.success() {
                    println!("cargo:warning=npm build failed, frontend will not be embedded");
                }
            }
        }
    }
}
