import "zone.js";
// biome-ignore lint/style/useImportType: <explanation>
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  type ElementRef,
  Inject,
  Input,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
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
export class Manager implements AfterViewInit {
  /** */
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Add") CodBi_LocalAPIDoc_New_Panel_Add!: ElementRef;
  /** */
  @ViewChild("CodBi_LocalAPIDoc_New") CodBi_LocalAPIDoc_New!: ElementRef;
  /** */
  @ViewChild("CodBi_LocalAPIDoc_Add") CodBi_LocalAPIDoc_Add!: ElementRef;
  /** */
  @ViewChild("CodBi_LocalAPIDoc_New_Name") CodBi_LocalAPIDoc_New_Name!: ElementRef;
  /** */
  @ViewChild("CodBi_LocalAPIDoc_Tree") CodBi_LocalAPIDoc_Tree!: ElementRef;

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

  protected addTreeNodes(path: string, addTo: TreeNode<{ label: string; children: TreeNode[] }>[]) {
    console.log(path);
    let currentNodelevel: TreeNode<{ label: string; children: TreeNode[] }>[] = addTo;

    for (const part of path.split(".")) {
      let existent = false;

      for (const node of currentNodelevel) {
        if (node.label === part) {
          existent = true;
        }
      }

      if (!existent) {
        currentNodelevel.push({ label: part, children: [] });
      }

      currentNodelevel = currentNodelevel.find((candidate) => candidate.label === part).children;
    }

    console.log(addTo);
  }

  ngAfterViewInit() {
    this.CodBi_LocalAPIDoc_New_Panel_Add.nativeElement.addEventListener("click", (event) => {
      console.log(this.CodBi_LocalAPIDoc_New_Name);
      this.addTreeNodes(this.CodBi_LocalAPIDoc_New_Name.nativeElement.value, this.items);
      this.cdr.markForCheck();
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";
    });

    this.CodBi_LocalAPIDoc_Add.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "block";
    });
  }
  // biome-ignore lint/style/noParameterProperties: <explanation>
  constructor(private cdr: ChangeDetectorRef) {}
}
