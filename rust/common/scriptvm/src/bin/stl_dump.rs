use scriptvm::iql_stl;

pub fn main() {
    // nosemgrep: rust.lang.security.args.args
    let output_file = std::env::args()
        .next_back()
        .expect("Usage: stl_dump <output_file>");
    println!("Writing to {output_file}");
    let res = format!(
        "RUST_SCRIPTVM_STL = [\n  {}\n]",
        scriptvm::stl()
            .iter()
            .map(|(name, _)| name.as_str())
            .chain(iql_stl().functions().keys().map(|name| name.as_str()))
            .map(|n| format!("\"{n}\""))
            .collect::<Vec<_>>()
            .join(",\n  ")
    );
    std::fs::write(output_file, res.as_bytes()).expect("Failed to write output file");
}
