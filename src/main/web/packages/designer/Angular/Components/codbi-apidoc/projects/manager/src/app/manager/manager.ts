import "zone.js";
import { Component, Inject, Input, ViewEncapsulation } from "@angular/core";
import { TabsModule } from "primeng/tabs";
import { TreeModule } from "primeng/tree";
// biome-ignore lint/style/useImportType: <explanation>
import { TreeNode } from "primeng/api";
import { DEFINED } from "xdbc/src/DBC/DEFINED";

interface ApiDoc {
  // Declare properties you're adding to window

  detStandards: {
    [key: string]: {
      Description: string;
      Active: boolean;
      classes: { [key: string]: string };
      globals: { [key: string]: string };
    };
  };
  detFunctionalities: { [key: string]: { Description: string; Parameter: string } };
  detElementplaceholder: { [key: string]: { Description: string } };
  docsAPI: [{ [key: string]: string }];
  fileListing: Array<string>;
  fslElementplaceholder: Array<string>;
  fslFunctionalities: Array<string>;
}

/**
 *
 */
@Component({
  selector: "cb-manager",
  imports: [TabsModule, TreeModule],
  templateUrl: "./manager.html",
  styleUrl: "./manager.scss",
  encapsulation: ViewEncapsulation.None,
})
export class Manager {
  items: TreeNode[] = [
    {
      label: "Folder 1",
      children: [
        { label: "File A" },
        { label: "File B" },
        {
          label: "Subfolder 1",
          children: [{ label: "Subfile X" }, { label: "Subfile Y" }],
        },
      ],
    },
    {
      label: "Folder 2",
      children: [{ label: "File C" }, { label: "File D" }],
    },
  ];

  apiDoc: ApiDoc | undefined;

  @Input("segment")
  set segment(toSet: "detFunctionalities" | "detElementplaceholder") {
    //this.items = this.toTreeNode(DEFINED.tsCheck<ApiDoc>(this.apiDoc)[toSet]);
  }

  @Input("apidoc")
  set apidoc(toSet: string) {
    this.apiDoc = JSON.parse(toSet);

    console.log(this.apiDoc);
  }

  protected toTreeNode(segmentToConvert: { [key: string]: { [key: string]: string } }): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in segmentToConvert) {
      result.push({ label: key });
    }

    return result;
  }
}
