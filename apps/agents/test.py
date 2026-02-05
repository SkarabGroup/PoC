from tools.spellAgentTools import *
from tools.orchestratorTools import clone_repo_tool, analyze_spelling_tool

print("Starting test...")
clone_repo_tool("https://github.com/SkarabGroup/DocumentazioneProgetto", "tmp")

print("Cloning done. Starting analysis...")
dict = find_docs_files("tmp/DocumentazioneProgetto")

print("Files found:")
for key in dict:
    print(f"{key}: {dict[key]}")

    print("Analyzing files...")
    res = []
    for key in dict["file_paths"]:
        print(f"\n\nAnalyzing {key}...")
        print(analyze_spelling(key, {}, ["it","en_US"]))
