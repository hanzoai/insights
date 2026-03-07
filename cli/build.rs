// Debug token, used to get metrics for debug builds
const DEBUG_INSIGHTS_API_TOKEN: &str = "phc_raG2H9V246hkNZk6K89DZGG98qQyPrKKlicifGlpOXA";

// This build file just sets this token for debug builds - for production builds, we use the token from our CI's secrets
pub fn main() {
    let profile = std::env::var("PROFILE").expect("Profile variable is set by cargo");
    if profile == "debug" {
        println!("cargo:rustc-env=INSIGHTS_API_TOKEN={DEBUG_INSIGHTS_API_TOKEN}");
    } else {
        eprintln!("Not setting debug insights api token");
    }
}
