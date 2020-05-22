import { actdb } from "../deps.ts";

export class DailyFileAdapter extends actdb.FileAdapter {
  constructor(
    public baseFilePath: string,
    public fileName: string = "actdb.json",
  ) {
    super(fileName);
  }

  overrideActualFilePath(): void {
    const now = new Date();
    super.filePath = `${this.baseFilePath}/${now.getFullYear()}_${
      now.getMonth() + 1
    }_${now.getDate()}_${this.fileName}`;
  }

  read() {
    this.overrideActualFilePath();
    return super.read();
  }

  async write(tree: actdb.AdapterTree) {
    this.overrideActualFilePath();
    super.write(tree);
  }
}
