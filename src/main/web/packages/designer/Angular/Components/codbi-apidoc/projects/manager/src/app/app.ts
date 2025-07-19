import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
  selector: "cb-root",
  imports: [RouterOutlet, TranslocoModule],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  protected title = "manager";
}
