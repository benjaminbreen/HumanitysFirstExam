export type SchemaTone = "rust" | "blue" | "green" | "gold";

const tones: Record<string, SchemaTone> = {
  "human-agency": "rust",
  "free-will-and-automatism": "rust",
  "habit-and-self-command": "rust",
  "moral-responsibility": "rust",
  automatism: "rust",
  voluntarism: "rust",
  vitalism: "rust",
  compatibilism: "rust",
  pragmatism: "rust",

  "machines-and-agency": "blue",
  "tools-and-agents": "blue",
  "machine-minds-and-made-persons": "blue",
  "dependence-succession-and-replacement": "blue",
  succession: "blue",
  instrument: "blue",
  "emergent-mind": "blue",
  "bounded-servant": "blue",
  "made-persons": "blue",

  "society-and-power": "green",
  "labour-and-mechanization": "green",
  "government-measurement-and-surveillance": "green",
  "crowds-media-and-public-opinion": "green",
  misalignment: "green",
  "social-arrangement": "green",
  dependence: "green",
  "no-threat": "green",

  "human-futures": "gold",
  "progress-and-decline": "gold",
  "heredity-and-biological-control": "gold",
  "technological-catastrophe": "gold",
  restrict: "gold",
  govern: "gold",
  accept: "gold",
};

export function schemaTone(id: string): SchemaTone | undefined {
  return tones[id];
}
