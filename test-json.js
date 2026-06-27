const str = "```json\n{\"foo\":\"bar\"}\n```";
let cleanJson = str.trim();
if (cleanJson.startsWith('```')) {
  cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}
console.log("CLEAN:", cleanJson);
console.log("PARSED:", JSON.parse(cleanJson));
