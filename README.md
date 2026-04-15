# Model Mapping Merger

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?logo=github)](https://iamthevision.github.io/geyser-mapping-merger/)

A simple web-based tool designed to merge and sort custom model data mapping files for **GeyserMC**, a project that enables cross-play between Minecraft: Java Edition and Bedrock Edition.

## ✨ Overview

The **Model Mapping Merger** provides a straightforward interface for combining multiple Geyser custom mapping JSON files into a single, consolidated file. This is particularly useful for server administrators and content creators who manage multiple custom item/block packs and need to unify their `geyser_mappings.json` configurations.

## 🎯 Use Cases
- **Unifying Mappings**: Combine custom mappings from multiple datapacks or plugins into one `custom_mappings` file.
- **Sorting**: Automatically sorts the merged JSON structure for better readability and consistency.
- **Deployment**: Simplify the deployment of custom content to a Geyser proxy or standalone server.

## 🛠️ How to Use
1.  **Visit the Tool**: Go to [Model Mapping Merger](https://iamthevision.github.io/geyser-mapping-merger/).
2.  **Select Files**:
    - Click or drag-and-drop your first mapping JSON file into the "First Mapping JSON" area.
    - Do the same for your second file in the "Second Mapping JSON" area.
3.  **Merge**: The output will automatically appear in the output area.
4.  **Copy/Save**: Copy the merged JSON content or save it to a file (e.g., `geyser_mappings.json`).

## ⚙️ Geyser Custom Mappings Context
Geyser uses custom mapping files to define how custom Bedrock items/blocks should be translated for Java Edition players. These JSON files are typically placed in the `custom_mappings` folder of your Geyser installation. For more details, refer to the official Geyser documentation:

- [Geyser Custom Items](https://geysermc.org/wiki/geyser/custom-items/)
- [Geyser Custom Blocks](https://geysermc.org/wiki/geyser/custom-blocks/)

## 🧩 Example
Input File 1 (`my_custom_items.json`):
```json
{
  "format_version": 1,
  "items": {
    "minecraft:carrot_on_a_stick": {
      "bedrock_identifier": "my_pack:custom_sword"
    }
  }
}
