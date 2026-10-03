import os from "node:os";
import path from "node:path";

// Testy nie mogą dotykać prawdziwego magazynu data/hub-data.json – każdy plik testów dostaje własny plik tymczasowy.
process.env.HUB_DATA_FILE = path.join(os.tmpdir(), `hub-test-${process.pid}-${Math.random().toString(36).slice(2)}`, "hub-data.json");
