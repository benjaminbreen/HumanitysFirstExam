import batch01 from "./batch-01.json";
import batch02 from "./batch-02.json";
import batch03 from "./batch-03.json";
import batch04 from "./batch-04.json";
import batch05 from "./batch-05.json";
import batch06 from "./batch-06.json";
import batch07 from "./batch-07.json";
import batch08 from "./batch-08.json";
import batch09 from "./batch-09.json";
import batch10 from "./batch-10.json";
import batch11 from "./batch-11.json";
import batch12 from "./batch-12.json";
import batch13 from "./batch-13.json";
import batch14 from "./batch-14.json";
import batch15 from "./batch-15.json";
import batch16 from "./batch-16.json";
import batch17 from "./batch-17.json";
import batch18 from "./batch-18.json";
import batch19 from "./batch-19.json";
import batch20 from "./batch-20.json";
import batch21 from "./batch-21.json";
import batch22 from "./batch-22.json";

type JsonRecord = Record<string, unknown>;

function recordsFromBatch(batch: unknown): JsonRecord[] {
  if (Array.isArray(batch)) {
    return batch.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const source = entry as JsonRecord;
      const passages = source.passages;
      if (!Array.isArray(passages)) return [];
      return passages.map((passage) => ({
        ...(passage as JsonRecord),
        sourceId: source.sourceId,
      }));
    });
  }
  if (!batch || typeof batch !== "object") return [];
  const records = (batch as JsonRecord).records;
  return Array.isArray(records) ? (records as JsonRecord[]) : [];
}

/**
 * Machine-assisted, passage-level classifications for the full reading corpus.
 * Each batch is retained separately for auditability; this is the public union.
 */
export const corpusCodingRecords = [
  batch01, batch02, batch03, batch04, batch05, batch06, batch07, batch08,
  batch09, batch10, batch11, batch12, batch13, batch14, batch15, batch16,
  batch17, batch18, batch19, batch20, batch21, batch22,
].flatMap(recordsFromBatch);
