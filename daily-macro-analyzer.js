module.exports = async (tp) => {
    const content = tp.file.content;
  
    const positioning = content.includes("100% in cash")
      ? "#riskoff"
      : content.includes("risk-on")
      ? "#riskon"
      : content.includes("in pause")
      ? "#pause"
      : "#neutral";
  
    const macro = content.includes("inflation")
      ? "#inflation"
      : content.includes("liquidity")
      ? "#liquidity"
      : content.includes("macro")
      ? "#macro"
      : "#unknownmacro";
  
    const updatedTags = `\n\n%% Auto-tagged by Templater %%\nTags: ${positioning} ${macro}\n`;
  
    // Append tags if not already present
    if (!content.includes("#risk") && !content.includes("#macro")) {
      await tp.file.append(updatedTags);
    }
  };
  console.log("🧠 Macro Analyzer script executed");