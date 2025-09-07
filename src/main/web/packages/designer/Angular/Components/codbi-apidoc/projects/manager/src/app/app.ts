import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@Component({
  selector: "cb-root",
  imports: [RouterOutlet, TranslocoModule, BrowserAnimationsModule],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected title = "manager";
}
