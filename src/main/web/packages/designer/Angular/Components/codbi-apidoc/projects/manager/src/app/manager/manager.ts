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
  NgModule,
} from "@angular/core";
import { TabsModule } from "primeng/tabs";
// biome-ignore lint/style/useImportType: <explanation>
import { TabViewChangeEvent } from "primeng/tabview";
// biome-ignore lint/style/useImportType: <explanation>
import { Tree, TreeModule, TreeNodeSelectEvent } from "primeng/tree";
// biome-ignore lint/style/useImportType: <explanation>
import { TreeNode } from "primeng/api";
import { SplitterModule } from "primeng/splitter";
import { AccordionModule } from "primeng/accordion";
import { SafeHtmlPipe } from "./SafeHtmlPipe.js";
import { EditorModule, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { TagModule } from "primeng/tag";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import Aura from "@primeuix/themes/aura";
import { NgTemplateOutlet } from "@angular/common";
import { DEFINED } from "xdbc/src/DBC/DEFINED";

interface ApiParameter {
  Name: string;
  Description: string;
  id: number;
}

interface ApiClass {
  Name: string;
  Description: string;
  id: number;
}

class CommonApiParameter implements ApiParameter {
  Name = "";
  Description = "";
  id;

  constructor(name: string, description: string, id = Math.random()) {
    this.Name = name;
    this.Description = description;
    this.id = id;
  }
}
interface ApiDoc {
  // Declare properties you're adding to window

  detStandards: {
    [key: string]: {
      Description: string;
      Globals: ApiParameter[];
      Classes: ApiClass[];
    };
  };
  detFunctionalities: { [key: string]: { Description: string; Parameter: ApiParameter[] } };
  detElementplaceholder: { [key: string]: { Description: string; Parameter: ApiParameter[] } };
  docsAPI: [{ [key: string]: string }];
  fileListing: Array<string>;
  fslElementplaceholder: Array<string>;
  fslFunctionalities: Array<string>;
}

interface nodeData {
  label: string;
  Description: string; // Ensure the casing matches 'Description'
  Classes: ApiClass[];
  Globals: ApiParameter[];
  Parameter: ApiParameter[];
  Notes: string;
  // No need for 'children' here, as TreeNode itself has a 'children' property
}
/**
 *
 */
@Component({
  selector: "cb-manager",
  imports: [
    TabsModule,
    TreeModule,
    SplitterModule,
    AccordionModule,
    SafeHtmlPipe,
    EditorModule,
    BrowserAnimationsModule,
    BrowserModule,
    TagModule,
    FormsModule,
    TableModule,
  ],
  providers: [
    {
      provide: TINYMCE_SCRIPT_SRC,
      useValue:
        "http://localhost:8080/xima-formcycle/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce/tinymce.min.js", // Point to your local path
    },
  ],
  templateUrl: "./manager.html",
  styleUrl: "./manager.scss",
  encapsulation: ViewEncapsulation.None,
})
export class Manager implements AfterViewInit {
  @Input() resourceurl: string | undefined;
  /** */
  @ViewChild("CodBi_LocalAPIDoc") CodBi_LocalAPIDoc!: ElementRef;
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
  /** */
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Close") CodBi_LocalAPIDoc_New_Panel_Close!: ElementRef;
  /** */
  @ViewChild("CodBi_LocalAPIDoc_Functionalities_Description")
  CodBi_LocalAPIDoc_Functionalities_Description!: ElementRef;

  items: TreeNode[] = [];

  itemsElementplaceholder = [];

  itemsStandard = [];
  apiDoc: ApiDoc | undefined;

  @Input("segment")
  set segment(toSet: "detFunctionalities" | "detElementplaceholder") {
    //this.items = this.toTreeNode(DEFINED.tsCheck<ApiDoc>(this.apiDoc)[toSet]);
  }

  _docPath: string | undefined;
  @Input("docpath")
  set docPath(toSet: string) {
    this._docPath = toSet;
  }

  get docPath(): string {
    return this._docPath;
  }

  @Input("apidoc")
  set apidoc(toSet: string) {
    this.apiDoc = JSON.parse(toSet);

    console.log(this.apiDoc);
  }

  protected _currentNodeData: nodeData | undefined;

  get currentlySelectedFunctionalityData(): nodeData {
    return this._currentNodeData;
  }

  public set currentlycurrentlySelectedFunctionalityData(toSet: nodeData) {
    if (this._currentNode) {
      this._currentNode.data = toSet;
    }
  }

  get description(): string {
    return this._currentNodeData ? this._currentNodeData.Description : "N/A";
  }

  set description(toSet: string) {
    if (this._currentNodeData === undefined) {
      return;
    }
    if (this._currentNodeData.Description === undefined) {
      this._currentNodeData.Description = "";
    }

    this._currentNodeData.Description = toSet;
  }

  protected toTreeNode(segmentToConvert: { [key: string]: { [key: string]: string } }): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in segmentToConvert) {
      result.push({ label: key });
    }

    return result;
  }

  protected addTreeNodes(path: string, addTo: TreeNode<nodeData>[]) {
    let currentNodelevel: TreeNode<nodeData>[] = addTo;

    for (const part of path.split(".")) {
      let existent = false;

      for (const node of currentNodelevel) {
        if (node.label === part) {
          existent = true;
        }
      }

      if (!existent) {
        currentNodelevel.push({
          label: part, // PrimeNG TreeNode has a top-level label
          data: {
            // The 'data' property holds your custom data
            label: part, // Redundant if TreeNode.label is used, but good for consistency
            Description: "<h2>Hier eine Beschreibung mitsamt Parameter und deren Beschreibung eintragen</h2>",
            Globals: [],
            Classes: [],
            Parameter: [],
            Notes: "Neu Erstellt",
          },
          children: [], // Initialize children for the new node
        });
      }

      currentNodelevel = currentNodelevel.find((candidate) => candidate.label === part).children;
    }
  }

  onKeyDown_CodBi_LocalAPIDoc_New_Name(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.CodBi_LocalAPIDoc_New_Panel_Add.nativeElement.click();
    }
  }

  get notes() {
    return this.currentlySelectedFunctionalityData ? this.currentlySelectedFunctionalityData.Notes : "";
  }
  set notes(toSet: string) {
    if (this.currentlySelectedFunctionalityData) {
      this.currentlySelectedFunctionalityData.Notes = toSet;
    }
  }

  convertNodes(toExtractFrom: TreeNode[], base: string | undefined = undefined): object {
    const result = {};

    for (const node of toExtractFrom) {
      result[`${base ? `${base}.` : ""}${node.label}`] = {
        Description: node.data ? node.data.Description : "",
        Parameter: node.data ? this.arrayToObject(node.data.Parameter) : [],
      };

      if (node.children) {
        const extractedChilds = this.convertNodes(node.children, node.label);

        for (const child in extractedChilds) {
          result[child] = extractedChilds[child];
        }
      }
    }

    return result;
  }

  arrayToObject(toConvert: [{ Name: string; Description: string }]) {
    const result = {};

    for (const element of toConvert) {
      result[element.Name] = element.Description;
    }

    return result;
  }
  convertStandardNodes(toExtractFrom: TreeNode[], base: string | undefined = undefined): object {
    const result = {};

    for (const node of toExtractFrom) {
      result[`${base ? `${base}.` : ""}${node.label}`] = {
        Description: node.data ? node.data.Description : "",
        Globals: node.data ? this.arrayToObject(node.data.Globals) : [],
        Classes: node.data ? this.arrayToObject(node.data.Classes) : [],
      };

      if (node.children) {
        const extractedChilds = this.convertStandardNodes(node.children, node.label);

        for (const child in extractedChilds) {
          result[child] = extractedChilds[child];
        }
      }
    }

    return result;
  }

  NodesToData() {
    const result: { detFunctionalities: object; detElementplaceholder: object; detStandards: object } = {
      detFunctionalities: this.convertNodes(this.items),
      detElementplaceholder: this.convertNodes(this.itemsElementplaceholder),
      detStandards: this.convertStandardNodes(this.itemsStandard),
    };

    return result;
  }

  enrichData(destination, source) {
    for (const element in source.detFunctionalities) {
      destination.detFunctionalities[element] = source.detFunctionalities[element];
    }
    for (const element in source.detElementplaceholder) {
      for (const key in source.detElementplaceholder[element]) {
        source.detElementplaceholder[key] = source.detElementplaceholder[element][key];
      }
    }
    for (const element in source.detStandards) {
      for (const key in source.detStandards[element]) {
        source.detStandards[key] = source.detStandards[element][key];
      }
    }
  }

  enSync() {
    console.log(this.NodesToData());
    this.enrichData(window[this.docPath], this.NodesToData());

    console.log("F", this.docPath, window[this.docPath]);
  }

  bufferParameter: Map<number, ApiParameter> = new Map<number, ApiParameter>();
  onRowEditInit(product: ApiParameter) {
    console.log("-1", product);
    this.bufferParameter[product.id] = new CommonApiParameter(product.Name, product.Description, product.id);
  }

  onRowEditSave(product: ApiParameter, index: number, toAdd: string) {
    console.log("x", this.currentlySelectedFunctionalityData);
    (toAdd === undefined || toAdd.toLowerCase() === "parameter"
      ? this.currentlySelectedFunctionalityData.Parameter
      : toAdd.toLowerCase() === "classes"
        ? this.currentlySelectedFunctionalityData.Classes
        : this.currentlySelectedFunctionalityData.Globals)[index] = product;
  }

  onRowEditCancel(parameter: ApiParameter, index: number) {
    console.log("1", this._currentNodeData.Parameter[index]);
    this._currentNodeData.Parameter[index] = this.bufferParameter[parameter.id];
    console.log("2", this._currentNodeData.Parameter[index]);
    this._currentNodeData = this._currentNodeData;
  }

  onRowDelete(parameter: ApiParameter) {
    this._currentNodeData.Parameter = this._currentNodeData.Parameter.filter(
      (candidate) => candidate.id !== parameter.id,
    );
  }

  activeAccordion: string[] = ["Description"];
  _activeTab: string | number = "Functionality";

  get activeTab() {
    return this._activeTab;
  }
  set activeTab(toSet: string | number) {
    if (this._activeTab !== toSet) {
      this._activeTab = toSet;

      this.currentlySelectedTreeNode =
        this.activeTab === "Functionality"
          ? this.items[0]
          : this.activeTab === "Elementplaceholder"
            ? this.itemsElementplaceholder[0]
            : this.itemsStandard[0];
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  removeNodeRecursive(nodes: TreeNode[] | undefined, dataToRemove: any): TreeNode[] {
    if (!nodes) {
      return []; // If no nodes, return empty array
    }

    const newNodes: TreeNode[] = [];

    for (const node of nodes) {
      // Check if the current node is the one to remove
      if (node === dataToRemove) {
        // Skip this node, effectively removing it
        continue;
      }

      // If the node has children, recursively filter its children
      if (node.children && node.children.length > 0) {
        const filteredChildren = this.removeNodeRecursive(node.children, dataToRemove);
        // Create a shallow copy of the node and update its children
        node.children = filteredChildren;
      }
      // If no children or not the node to remove, keep the node as is (or a shallow copy)
      newNodes.push(node);
    }

    return newNodes;
  }
  onDeleteNode(event: Event) {
    switch (this.activeTab) {
      case "Functionality":
        this.items = this.removeNodeRecursive(this.items, this._currentNode);

        break;

      case "Elementplaceholder":
        this.items = this.removeNodeRecursive(this.itemsElementplaceholder, this._currentNode);

        break;

      case "Standard":
        this.items = this.removeNodeRecursive(this.itemsStandard, this._currentNode);

        break;
    }
  }

  currentlySelectedTreeNode: TreeNode;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  _descriptionEditor: any;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onInitTinyMCE_Description(event: any) {
    this._descriptionEditor = event.editor;
    console.log("i");
    //this._descriptionEditor = event.editor ;
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  _currentNode: any;
  onNodeSelect(event: TreeNodeSelectEvent) {
    this._currentNode = event.node;
    this._currentNodeData = event.node.data
      ? event.node.data
      : { Description: "<h2 style = 'color:red'>Keine Beschreibung verfügbar</h2>" };
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onTabChange(event: string | number) {
    console.log(event);
  }

  ngAfterViewInit() {
    if (this.items && this.items.length > 0) {
      this.currentlySelectedTreeNode = this.items[0];
    }

    this.CodBi_LocalAPIDoc_New_Panel_Add.nativeElement.addEventListener("click", (event) => {
      this.addTreeNodes(
        this.CodBi_LocalAPIDoc_New_Name.nativeElement.value,
        this.activeTab === "Functionality"
          ? this.items
          : this.activeTab === "Elementplaceholder"
            ? this.itemsElementplaceholder
            : this.itemsStandard,
      );
      this.cdr.markForCheck();
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    });

    this.CodBi_LocalAPIDoc_Add.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "flex";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.add("-submerged");
      this.CodBi_LocalAPIDoc_New_Name.nativeElement.focus();
    });

    this.CodBi_LocalAPIDoc_New_Panel_Close.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    });
  }

  onClick_CodBi_LocalAPIDoc_RightPanel_AddParameter(toAdd: string) {
    (toAdd === undefined || toAdd.toLowerCase() === "parameter"
      ? this.currentlySelectedFunctionalityData.Parameter
      : toAdd.toLowerCase() === "classes"
        ? this.currentlySelectedFunctionalityData.Classes
        : this.currentlySelectedFunctionalityData.Globals
    ).push(new CommonApiParameter("Neuer Parameter...", "Keine Beschreibung..."));
  }
  // biome-ignore lint/style/noParameterProperties: <explanation>
  constructor(private cdr: ChangeDetectorRef) {}
}
