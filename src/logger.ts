export class Logger {
  constructor(public active: boolean) {}
  log(message: string) {
    if (this.active) {
      console.log(message);
    }
  }
}
