use std::path::PathBuf;

use anyhow::{Context, Error};

// IF `INSIGHTS_HOME` is set, use that, otherwise use $HOME/.insights
pub fn insights_home_dir() -> PathBuf {
    match std::env::var("INSIGHTS_HOME") {
        Ok(home) => PathBuf::from(home),
        Err(_) => {
            let mut home = dirs::home_dir().expect("Could not find home directory");
            home.push(".insights");
            home
        }
    }
}

pub fn ensure_homedir_exists() -> Result<(), Error> {
    let home = insights_home_dir();
    std::fs::create_dir_all(&home).context(format!("While trying to create directory {home:?}"))?;
    Ok(())
}
