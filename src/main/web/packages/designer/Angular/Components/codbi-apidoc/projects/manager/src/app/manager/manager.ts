import { getJQuery } from "@de-xima/fc-form-designer";
import "zone.js";
import { i18n } from "../../../../../../../../src/js/i18n";
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
  input,
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
import { SafeHtmlPipe } from "./SafeHtmlPipe";
import { EditorModule, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { TagModule } from "primeng/tag";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { trigger, state, style, animate, transition } from "@angular/animations";

import Aura from "@primeuix/themes/aura";
import { CommonModule, NgTemplateOutlet } from "@angular/common";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { ZOD } from "xdbc/src/DBC/ZOD";
import { z } from "zod";
import type { TMessageKey } from "codbi-common";
// biome-ignore lint/style/useImportType: <explanation>

// biome-ignore lint/style/useImportType: <explanation>
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
// biome-ignore lint/style/useImportType: <explanation>
import { Observable } from "rxjs";
// biome-ignore lint/style/useImportType: <explanation>
import { Translation, TranslocoLoader, TranslocoService, TranslocoModule, TranslocoPipe } from "@ngneat/transloco";

@Injectable({
  providedIn: "root",
})
export class WebComponentTranslocoHttpLoader implements TranslocoLoader {
  // IMPORTANT: This is the base URL of your "space provider" where translations are hosted.
  // Replace this with your actual CDN or server URL.
  // Example: 'https://my-cdn.com/my-app-translations/'
  // Example: 'https://my-static-server.com/assets/i18n/'
  private TRANSLATIONS_BASE_URL = "https://your-space-provider.com/my-web-component/assets/i18n";

  // biome-ignore lint/style/noParameterProperties: <explanation>
  constructor(private http: HttpClient) {}

  /**
   * Fetches the translation file for a given language and optional scope.
   * @param lang The language code (e.g., 'en', 'es').
   * @param scope Optional scope for lazy-loaded translations (e.g., 'products').
   * @returns An Observable that emits the translation JSON.
   */
  getTranslation(
    lang: string,
    data?: { scope?: string }, // <--- Corrected type: inline object literal
  ): Observable<Translation> {
    let url = `${window.location.href.split("/").slice(0, 4).join("/")}/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/i18n/LocalAPIDocManager/${lang}`;

    /*const scope = data?.scope; // Access scope from the data object

    if (scope) {
      url += `/${scope}`;
    }*/
    url += ".json";

    console.log(`Web Component is fetching translation from: ${url}`);
    return this.http.get<Translation>(url);
  }
}

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
      globals: ApiParameter[];
      classes: ApiClass[];
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
  classes: ApiClass[];
  globals: ApiParameter[];
  Parameter: ApiParameter[];
  Notes: string;
  // No need for 'children' here, as TreeNode itself has a 'children' property
}

interface InputDataItem {
  Description?: string;
  globals?: { [name: string]: string } | SimplifiedNamedItem[]; // Can be an object of name:description, or an array of {Name, Description}
  classes?: { [name: string]: string } | SimplifiedNamedItem[];
  Parameter?: { [name: string]: string } | SimplifiedNamedItem[];
}

interface InputData {
  detStandards?: { [key: string]: InputDataItem };
  detFunctionalities?: { [key: string]: InputDataItem };
  detElementplaceholder?: { [key: string]: InputDataItem };
  docsAPI?: string[];
  fileListing?: string[];
  fslElementplaceholder?: string[];
  fslFunctionalities?: string[];
}

// Define the new structure for the initial tree to merge into
interface InitialTreeObject {
  detStandards?: TreeNode[];
  detFunctionalities?: TreeNode[];
  detElementplaceholder?: TreeNode[];
  docsAPI?: TreeNode[];
  fileListing?: TreeNode[];
  fslElementplaceholder?: TreeNode[];
  fslFunctionalities?: TreeNode[];
  // You can add other top-level keys here if your tree has more static sections
  [key: string]: TreeNode[] | undefined; // Allow for other top-level keys
}

interface SimplifiedNamedItem {
  Name?: string;
  Description?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any; // Allow other properties if present, but we'll prioritize Name/Description
}
/**
 *
 */
@Component({
  selector: "cb-manager",
  imports: [
    CommonModule,
    TranslocoPipe,
    TranslocoModule,
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
  animations: [
    trigger("tabContentAnimation", [
      state(
        "false",
        style({
          opacity: 0,
          transform: "translateX(-20px)",
        }),
      ),
      state(
        "true",
        style({
          opacity: 1,
          transform: "translateX(0)",
        }),
      ),
      transition("inactive <=> active", [animate("300ms ease-in-out")]),
      // You can also define animations for :enter and :leave if the content is dynamically added/removed
      transition(":enter", [
        // When content enters the DOM (e.g., first loaded or after initial inactive state)
        style({ opacity: 0, transform: "translateX(-20px)" }),
        animate("300ms ease-in-out", style({ opacity: 1, transform: "translateX(0)" })),
      ]),
      transition(":leave", [
        // When content leaves the DOM (less common for p-tab, as it typically hides)
        animate("300ms ease-in-out", style({ opacity: 0, transform: "translateX(20px)" })),
      ]),
    ]),
  ],
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
  /** */
  @ViewChild("CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue")
  CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue!: ElementRef;

  @ViewChild("CodBi_LocalAPIDoc_Tree_Rename_Input") CodBi_LocalAPIDoc_Tree_Rename_Input!: ElementRef;

  items: TreeNode[] = [];

  protected i18n(key: TMessageKey): string {
    return i18n(key);
  }

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

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  toTreeNodes(toConvert: { [key: string]: any }): TreeNode[] {
    const root: TreeNode[] = [];

    const keys = Object.keys(toConvert);

    for (const key of keys) {
      const parts = key.split(".");
      let currentLevel: TreeNode[] = root;
      let parentNode: TreeNode | undefined = undefined;
      let currentPathKey: string = ""; // To build the "0-1-2" key

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const existingNode = currentLevel.find((node) => node.label === part);

        if (existingNode) {
          parentNode = existingNode;
          currentLevel = existingNode.children;
          // Reconstruct currentPathKey for existing node based on its actual key
          currentPathKey = existingNode.key || "";
        } else {
          const globals = [];

          for (const gKey in toConvert[key].globals) {
            globals.push({ Name: gKey, Description: toConvert[key].globals[gKey] });
          }

          const classes = [];

          for (const cKey in toConvert[key].classes) {
            classes.push({ Name: cKey, Description: toConvert[key].classes[cKey] });
          }

          const newNode: TreeNode = {
            label: part,
            data: {
              Description: toConvert[key].Description,
              Parameter: toConvert[key].Parameter,
              globals: globals,
              classes: classes,
            },
            children: [],
            parent: parentNode,
          };

          // Determine the sibling index for the current part
          const siblingIndex = currentLevel.length;

          // Build the composite key
          if (currentPathKey === "") {
            newNode.key = siblingIndex.toString();
          } else {
            newNode.key = `${currentPathKey}-${siblingIndex}`;
          }
          currentPathKey = newNode.key; // Update for the next iteration

          currentLevel.push(newNode);

          parentNode = newNode;
          currentLevel = newNode.children;
        }
      }
    }

    return root;
  }
  @Input("apidoc")
  set apidoc(toSet: string) {
    this.apiDoc = JSON.parse(toSet);

    this.items = this.toTreeNodes(this.apiDoc.detFunctionalities);
    this.itemsElementplaceholder = this.toTreeNodes(this.apiDoc.detElementplaceholder);
    this.itemsStandard = this.toTreeNodes(this.apiDoc.detStandards);

    console.log("n11112222", this.apiDoc, this.items, this.itemsElementplaceholder, this.itemsStandard);
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

  protected toTreeNode(
    label: string,
    segmentToConvert: { Description: string; globals: object; classes: object; Parameter: object },
  ): TreeNode {
    const result: TreeNode = {
      label: label,
      data: {
        Description: segmentToConvert.Description,
        globals: segmentToConvert.globals,
        classes: segmentToConvert.classes,
        Parameter: segmentToConvert.Parameter,
      },
    };

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
            Description: "",
            globals: [],
            classes: [],
            Parameter: [],
            Notes: "Neu Erstellt",
          },
          children: [], // Initialize children for the new node
        });
      }

      currentNodelevel = currentNodelevel.find((candidate) => candidate.label === part).children;
    }
  }

  // #region Create New Element
  /**
   * The {@link HTMLParagraphElement } stating that the local CodBi-Element to created with the specified
   * {@link Manager.CodBi_LocalAPIDoc_New_Name } is already taken by a native CodBi-Element. */
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent")
  CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent!: ElementRef;
  /** Simulates a click on {@link Manager.CodBi_LocalAPIDoc_New_Panel_Add } in order to add a new element. */
  protected onEnter_CodBi_LocalAPIDoc_New_Name() {
    this.CodBi_LocalAPIDoc_New_Panel_Add.nativeElement.click();
  }
  /**
   * Stores the formerly inputted value of {@link Manager.CodBi_LocalAPIDoc_New_Name } in order to restore it
   * whenever an invalid character was entered. */
  protected formerInput_CodBi_LocalAPIDoc_New_Name: string = "";
  /**
   * Checks whether the new input of {@link Manager.CodBi_LocalAPIDoc_New_Name } is valid restoring to the
   * {@link Manager.formerInput_CodBi_LocalAPIDoc_New_Name } if not or updating the mentioned property, if so.
   *
   * @param event The {@link Event } that triggered this method. */
  protected onInput_CodBi_LocalAPIDoc_New_Name(event: Event) {
    this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "none";

    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    if (!/^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*(\.)?$/.test(inputControl.value)) {
      inputControl.value = this.formerInput_CodBi_LocalAPIDoc_New_Name;
    } else {
      this.formerInput_CodBi_LocalAPIDoc_New_Name = inputControl.value;
    }
  }
  /**
   * Removes any dots at the end of the input value of {@link Manager.CodBi_LocalAPIDoc_New_Name } prior to adding
   * the new element to the tree of the currently {@link Manager.activeTab }.
   * After that closes the dialog. */
  protected onClick_CodBi_LocalAPIDoc_New_Panel_Add() {
    // #region Remove trailing dot.
    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(
      this.CodBi_LocalAPIDoc_New_Name.nativeElement,
      HTMLInputElement,
    );

    if (inputControl.value[inputControl.value.length - 1] === ".") {
      inputControl.value = inputControl.value.substring(0, inputControl.value.length - 1);
    }
    // #endregion Remove trailing dot.
    // #region Check against CodBi Data.
    const lowercaseInputControl = inputControl.value.toLowerCase();

    if (
      Object.keys(window.CodbiPluginData.detFunctionalities)
        .map((e) => e.toLowerCase())
        .includes(lowercaseInputControl) ||
      Object.keys(window.CodbiPluginData.detElementplaceholder)
        .map((e) => e.toLowerCase())
        .includes(lowercaseInputControl) ||
      Object.keys(window.CodbiPluginData.detStandards)
        .map((e) => e.toLowerCase())
        .includes(lowercaseInputControl)
    ) {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "block";

      return;
    }
    // #endregion Check against CodBi Data.
    // #region Add new element to the tree and update it.
    this.addTreeNodes(
      this.CodBi_LocalAPIDoc_New_Name.nativeElement.value,
      this.activeTab === "Functionality"
        ? this.items
        : this.activeTab === "Elementplaceholder"
          ? this.itemsElementplaceholder
          : this.itemsStandard,
    );

    this.cdr.markForCheck();
    // #endregion Add new element to the tree and update it.
    // #region Close the dialog.
    this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";

    (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    // #endregion Close the dialog.
  }
  // #endregion Create New Element
  get notes() {
    return this.currentlySelectedFunctionalityData ? this.currentlySelectedFunctionalityData.Notes : "";
  }
  set notes(toSet: string) {
    if (this.currentlySelectedFunctionalityData) {
      this.currentlySelectedFunctionalityData.Notes = toSet;
    }
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
        globals: node.data ? this.arrayToObject(node.data.globals) : [],
        classes: node.data ? this.arrayToObject(node.data.classes) : [],
      };

      if (node.children) {
        const extractedChilds = this.convertStandardNodes(
          node.children,
          base === undefined ? node.label : `${base}.${node.label}`,
        );

        for (const child in extractedChilds) {
          result[child] = extractedChilds[child];
        }
      }
    }

    const finalResult = {};

    for (const key in result) {
      if (result[key].Description !== "") {
        finalResult[key] = result[key];
      }
    }
    return finalResult;
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
    const result = {
      fslFunctionalities: [],
      fslElementplaceholder: [],
      fileListing: [],
    };

    for (const element in source.detFunctionalities) {
      document.querySelector('div[is = "xc-epmanager"]').setAttribute(
        "options",
        JSON.parse(
          `${destination.fslFunctionalities.substring(0, destination.fslFunctionalities.length - 1)},\"${element}.ts\"]`,
        )
          .map((file: string) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          })
          .join(","),
      );
      result.fslFunctionalities.push(`${element}.ts`);
      console.log("o", document.querySelector('div[is = "xc-epmanager"'));
      destination.detFunctionalities[element.toLowerCase()] = source.detFunctionalities[element];
    }
    for (const element in source.detElementplaceholder) {
      document.querySelector('div[is = "xc-epmanager"]').setAttribute(
        "epoptions",
        JSON.parse(
          `${destination.fslElementplaceholder.substring(0, destination.fslElementplaceholder.length - 1)},\"${element}.ts\"]`,
        )
          .map((file: string) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          })
          .join(","),
      );
      result.fslElementplaceholder.push(`${element}.ts`);
      destination.detElementplaceholder[element] = source.detElementplaceholder[element];
    }
    for (const element in source.detStandards) {
      destination.fileListing = `${destination.fileListing.substring(0, destination.fileListing.length - 1)},\"${element}.ts\"]`;

      result.fileListing.push(`${element}.ts`);
      destination.detStandards[element] = source.detStandards[element];
    }

    return {
      fslFunctionalities: result.fslFunctionalities.join(","),
      fslElementplaceholder: result.fslElementplaceholder.join(","),
      fileListing: result.fileListing.join(","),
    };
  }

  @Input()
  public baseurl: string = "";
  onImport() {
    this.CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue.nativeElement.click();
  }
  onExport() {
    const localNodeData = this.NodesToData();
    const filelistings = this.enrichData(window[this.docPath], localNodeData);
    const toExport = JSON.stringify({
      fslFunctionalities: filelistings.fslFunctionalities,
      detFunctionalities: localNodeData.detFunctionalities,
      fslElementplaceholder: filelistings.fslElementplaceholder,
      detElementplaceholder: localNodeData.detElementplaceholder,
      detStandards: localNodeData.detStandards,
      fileListing: filelistings.fileListing,
    });

    const blob = new Blob([toExport], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CodBi / Local API-Documentation.json";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
  enSync() {
    const localNodeData = this.NodesToData();
    const filelistings = this.enrichData(window[this.docPath], localNodeData);
    window[this.docPath].populateStandards();
    const $ = getJQuery();
    $.ajax({
      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
      type: "GET",
      headers: {
        "X-Action": "Update",
        "X-ToWrite": JSON.stringify({
          fslFunctionalities: filelistings.fslFunctionalities,
          detFunctionalities: localNodeData.detFunctionalities,
          fslElementplaceholder: filelistings.fslElementplaceholder,
          detElementplaceholder: localNodeData.detElementplaceholder,
          detStandards: localNodeData.detStandards,
          fileListing: filelistings.fileListing,
        }),
      },
      success: (response) => {
        console.log("OK", response);
      },
    });
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
        ? this.currentlySelectedFunctionalityData.classes
        : this.currentlySelectedFunctionalityData.globals)[index] = product;
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
  // #region Renaming
  /**
   * Updates the {@link Manager.currentlySelectedTerrNode }'s {@link TreeNode.label } and
   * {@link Manager.currentlySelectedTreeNodeEditing } to false, ending editing mode, if the "Enter"-Key is pressed.
   *
   * @param event The received {@link KeyboardEvent }. */
  protected onKeyupRenameInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.currentlySelectedTreeNode.label = TYPE.tsCheck<HTMLInputElement>(
        event.target,
        typeof HTMLInputElement,
      ).value;
      this.currentlySelectedTreeNodeEditing = false;
    }
  }
  /**
   * Updates the {@link Manager.currentlySelectedTerrNode }'s {@link TreeNode.label } and
   * {@link Manager.currentlySelectedTreeNodeEditing } to false, ending editing mode.
   *
   * @param event The {@link FocusEvent } received. */
  protected onBlurRenameInput(event: FocusEvent) {
    this.currentlySelectedTreeNode.label = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value;
    this.currentlySelectedTreeNodeEditing = false;
  }
  // #endregion Renaming
  _currentlySelectedTreeNode: TreeNode;

  get currentlySelectedTreeNode(): TreeNode {
    return this._currentlySelectedTreeNode;
  }

  _formerCurrentlySelectedTreeNode: TreeNode;

  set currentlySelectedTreeNode(toSet: TreeNode) {
    if (toSet === null) {
      return;
    }
    this._formerCurrentlySelectedTreeNode = this._currentlySelectedTreeNode;

    this._currentlySelectedTreeNode = toSet;
    console.log("CurrentNode", this.currentlySelectedTreeNode);
  }
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
  /**
   * Sets {@link Manager._currentNode } and {@link Manager._currentNodeData }.
   *
   * @param event The {@link TreeNodeSelectEvent }. */
  onNodeSelect(event: TreeNodeSelectEvent) {
    this._currentNode = event.node;
    this._currentNodeData = event.node.data;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onTabChange(event: string | number) {
    console.log(event);
  }

  importNode(toImport: { detElementplaceholder: object; detFunctionalities: object; detStandards: object }) {
    for (const key in toImport.detFunctionalities) {
    }
    for (const key in toImport.detElementplaceholder) {
    }
    for (const key in toImport.detStandards) {
    }
  }
  // #region Exporting
  // #region Schematics
  /** The ZOD-Schema of a {@link TreeNode } needed by this {@link Manager }.*/
  protected static zshTeeNode = z.lazy(() =>
    z.object({
      label: z.string().optional(),
      data: z.any().optional(),
      children: z.array(Manager.zshTeeNode).optional(),
      key: z.string().optional(),
    }),
  );
  // #endregion Schematics
  /**
   * Converts a list of {@link TreeNode }s into a structured object.
   *
   * @param toExtractFrom The list of {@link TreeNode }s to convert.
   * @param base          The base string to prepend to the keys of the resulting object (for recursion only).
   *
   * @returns The structured object containing the converted nodes. */
  convertNodes(toExtractFrom: TreeNode[], base: string | undefined = undefined): object {
    const result = {};
    // #region Conversion.
    for (const node of toExtractFrom) {
      result[`${base ? `${base.toLowerCase()}.` : ""}${node.label.toLowerCase()}`] = {
        Description: node.data ? node.data.Description : "",
        Parameter: node.data ? this.arrayToObject(node.data.Parameter ? node.data.Parameter : []) : [],
        globals: node.data ? this.arrayToObject(node.data.globals) : [],
      };

      if (node.children) {
        const extractedChildren = this.convertNodes(
          node.children,
          base === undefined ? node.label : `${base.toLowerCase()}.${node.label.toLowerCase()}`,
        );

        for (const child in extractedChildren) {
          result[child.toLowerCase()] = extractedChildren[child];
        }
      }
    }
    // #endregion Conversion.
    // #region Remove elements with no description.
    const finalResult = {};

    for (const key in result) {
      if (result[key].Description !== "") {
        finalResult[key.toLowerCase()] = result[key];
      }
    }
    // #endregion Remove elements with no description.
    return finalResult;
  }
  /**
   * Exports the {@link Manager.currentlySelectedTreeNode } into a JSON file.
   *
   * @param event The {@link Event } received. */
  protected onExportNode(event: Event) {
    // #region Conversion
    const toExport: {
      detFunctionalities: object;
      detElementplaceholder: object;
      detStandards: object;
      fileListing: string[];
      fslFunctionalities: string[];
      fslElementplaceholder: string[];
    } = {
      detFunctionalities: {},
      detElementplaceholder: {},
      detStandards: {},
      fileListing: [],
      fslFunctionalities: [],
      fslElementplaceholder: [],
    };

    const toConvert = ZOD.tsCheck<TreeNode>(this.currentlySelectedTreeNode, Manager.zshTeeNode);

    switch (this.activeTab) {
      case "Functionality":
        toExport.detFunctionalities = this.convertNodes([toConvert]);
        toExport.fslFunctionalities = [`${toConvert.label}.ts`];
        break;

      case "Elementplaceholder":
        toExport.detElementplaceholder = this.convertNodes([toConvert]);
        toExport.fslElementplaceholder = [`${toConvert.label}.ts`];
        break;

      case "Standard":
        toExport.detStandards = this.convertNodes([toConvert]);
        toExport.fileListing = [`${toConvert.label}.ts`];

        break;
    }
    // #endregion Conversion
    // #region Save to file
    const blob = new Blob([JSON.stringify(toExport)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `CodBi / Local API-Documentation / ${this.activeTab} / ${toConvert.label}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    // #endregion Save to file
  }
  // #endregion Exporting
  // #region Internationalization
  @Input() protected language: string = "de";
  // #endregion Internationalization
  // #region Basic Operations
  /** Closes the {@link Manager.CodBi_LocalAPIDoc } panel by adding the `--closed` class to it. */
  protected onClick_CodBi_LocalAPIDoc_RightPanel_Options_ClosePanel() {
    this.CodBi_LocalAPIDoc.nativeElement.classList.add("--closed");
  }
  /** The {@link ChangeDetectorRef } for this {@link Manager }.*/
  protected cdr: ChangeDetectorRef;
  /** The {@link TranslocoService } used by this {@link Manager }. */
  protected translocoService: TranslocoService;
  /**
   * Constructs this {@link Manager } by registering **ALT + C** as the hotkey for showing/hiding itself.
   *
   * @param cdr The {@link Manager.cdr }. */
  constructor(cdr: ChangeDetectorRef, translocoService: TranslocoService) {
    this.cdr = cdr;
    this.translocoService = translocoService;
    // #region Hotkey Registration
    document.addEventListener("keyup", (event) => {
      if (event.altKey && event.key === "c") {
        if (this.CodBi_LocalAPIDoc.nativeElement.classList.contains("--closed")) {
          this.CodBi_LocalAPIDoc.nativeElement.classList.remove("--closed");
          this.CodBi_LocalAPIDoc.nativeElement.classList.add("--opened");
        } else {
          this.CodBi_LocalAPIDoc.nativeElement.classList.remove("--opened");
          this.CodBi_LocalAPIDoc.nativeElement.classList.add("--closed");
        }
      }
    });
    // #endregion Hotkey Registration
  }
  // #endregion Basic Operations
  mergeDataIntoStructuredTree(incomingData: InputData, initialTreeObject: InitialTreeObject = {}): InitialTreeObject {
    const mergedTree: InitialTreeObject = { ...initialTreeObject };

    const getOrCreateNode = (nodes: TreeNode[], fullLabel: string): TreeNode => {
      const parts = fullLabel.split(".");
      let currentNodes = nodes;
      let targetNode: TreeNode | undefined;

      for (let i = 0; i < parts.length; i++) {
        const labelPart = parts[i];
        let node = currentNodes.find((n) => n.label === labelPart);

        if (!node) {
          node = { label: labelPart, children: [] };
          currentNodes.push(node);
        }

        if (i === parts.length - 1) {
          targetNode = node;
        } else {
          currentNodes = node.children;
        }
      }
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return targetNode!;
    };
    /**
     * Helper to process incoming collection (globals, classes, Parameter) into an array of objects
     * on the target node's data. Each object in the array should ideally have a 'Name' property.
     * Ensures the target property is always an array and avoids adding duplicate items.
     * @param targetData The 'data' object of the TreeNode where the collection will be stored.
     * @param propName The name of the property to store (e.g., 'globals').
     * @param incomingCollection The raw incoming data for this property (can be array, object, etc.).
     */
    const processToArrayCollection = (
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      targetData: { [key: string]: any },
      propName: "globals" | "classes" | "Parameter",
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      incomingCollection: any,
    ) => {
      // CRITICAL FIX: Ensure targetData[propName] is ALWAYS an array.
      // If it's not an array (e.g., undefined, null, or a plain object from previous state),
      // re-initialize it as an empty array.
      if (!Array.isArray(targetData[propName])) {
        targetData[propName] = [];
      }
      const currentArray = targetData[propName]; // This is now guaranteed to be an array

      if (incomingCollection !== undefined && incomingCollection !== null) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const itemsToAdd: { Name?: string; Description?: string; [key: string]: any }[] = [];

        if (Array.isArray(incomingCollection)) {
          // If incoming is already an array of items (e.g., [{ Name: "foo", Description: "bar" }])
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          // biome-ignore lint/complexity/noForEach: <explanation>
          incomingCollection.forEach((item: any) => {
            // Use 'any' here as items can be varied
            if (typeof item === "object" && item !== null && item.Name !== undefined) {
              itemsToAdd.push(item);
            }
          });
        } else if (typeof incomingCollection === "object") {
          // If incoming is a single object.
          // It could be:
          // 1. A single item structured like { Name: "foo", Description: "bar", ... }
          // 2. A flat object of name:description pairs (e.g., { "Name1": "Desc1", "Name2": "Desc2" })

          if (
            incomingCollection.Name !== undefined &&
            (incomingCollection.Description !== undefined || Object.keys(incomingCollection).length > 1)
          ) {
            // Case 1: It looks like a single item object with a 'Name'
            // We include Description if it exists, or if there are other properties beyond just 'Name'
            itemsToAdd.push(incomingCollection);
          } else {
            // Case 2: Assume it's a flat object of name:description pairs (e.g., { "Name1": "Desc1", "Name2": "Desc2" })
            for (const nameKey in incomingCollection) {
              if (Object.prototype.hasOwnProperty.call(incomingCollection, nameKey)) {
                if (incomingCollection[nameKey] !== undefined && incomingCollection[nameKey] !== null) {
                  itemsToAdd.push({ Name: nameKey, Description: String(incomingCollection[nameKey]) });
                }
              }
            }
          }
        }

        // Now, merge itemsToAdd into currentArray, avoiding duplicates by 'Name'
        // biome-ignore lint/complexity/noForEach: <explanation>
        itemsToAdd.forEach((newItem) => {
          // Check if an item with the same 'Name' already exists in currentArray
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          const exists = currentArray.some((existingItem: any) => existingItem.Name === newItem.Name);
          if (!exists) {
            currentArray.push(newItem);
          } else {
            // If it exists, we could optionally merge properties if the user wanted that.
            // For now, "never overwritten" implies we don't modify existing array items.
            // If the existing item in the array has the same name, we just skip adding the new one.
          }
        });
      }
    };

    const processComplexSection = (
      sectionName: "detStandards" | "detFunctionalities" | "detElementplaceholder",
      dataSection: InputData["detStandards"] | InputData["detFunctionalities"] | InputData["detElementplaceholder"],
    ) => {
      if (!mergedTree[sectionName]) {
        mergedTree[sectionName] = [];
      }
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const targetArray = mergedTree[sectionName]!;

      for (const key in dataSection) {
        if (Object.prototype.hasOwnProperty.call(dataSection, key)) {
          const item = dataSection[key];

          const itemNode = getOrCreateNode(targetArray, key);

          // Store Description directly on itemNode
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          if (item.Description !== undefined && (itemNode as any).Description === undefined) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (itemNode as any).Description = item.Description;
          }

          // Ensure itemNode.data exists for globals, classes, Parameter
          if (!itemNode.data) {
            itemNode.data = {};
          }

          // Process globals, classes, and Parameter into itemNode.data as arrays
          processToArrayCollection(itemNode.data, "globals", item.globals);
          processToArrayCollection(itemNode.data, "classes", item.classes);
          processToArrayCollection(itemNode.data, "Parameter", item.Parameter);
        }
      }
    };

    const processSimpleSection = (
      sectionName: "docsAPI" | "fileListing" | "fslElementplaceholder" | "fslFunctionalities",
      dataSection:
        | InputData["docsAPI"]
        | InputData["fileListing"]
        | InputData["fslElementplaceholder"]
        | InputData["fslFunctionalities"],
    ) => {
      if (!mergedTree[sectionName]) {
        mergedTree[sectionName] = [];
      }
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const targetArray = mergedTree[sectionName]!;

      if (Array.isArray(dataSection)) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        dataSection.forEach((item) => {
          const itemNode = getOrCreateNode(targetArray, item);
          if (!itemNode.data) {
            itemNode.data = {};
          }
          if (itemNode.data.value === undefined) {
            itemNode.data.value = item;
          }
        });
      }
    };

    if (incomingData.detStandards) {
      processComplexSection("detStandards", incomingData.detStandards);
    }
    if (incomingData.detFunctionalities) {
      processComplexSection("detFunctionalities", incomingData.detFunctionalities);
    }
    if (incomingData.detElementplaceholder) {
      processComplexSection("detElementplaceholder", incomingData.detElementplaceholder);
    }
    if (incomingData.docsAPI) {
      processSimpleSection("docsAPI", incomingData.docsAPI);
    }
    if (incomingData.fileListing) {
      processSimpleSection("fileListing", incomingData.fileListing);
    }
    if (incomingData.fslElementplaceholder) {
      processSimpleSection("fslElementplaceholder", incomingData.fslElementplaceholder);
    }
    if (incomingData.fslFunctionalities) {
      processSimpleSection("fslFunctionalities", incomingData.fslFunctionalities);
    }

    return mergedTree;
  }
  /**
   *  Gets a {@link boolean } stating whether the {@link Manager.currentlySelectedTerrNode }'s {@link TreeNode.label }
   *  is currently being edited or not. */
  get currentlySelectedTreeNodeEditing() {
    // #region Prevent access failures.
    if (
      this.currentlySelectedTreeNode === null ||
      this.currentlySelectedTreeNode === undefined ||
      this.currentlySelectedTreeNode.data === null
    ) {
      return false;
    }
    // #endregion Prevent access failures.
    return this.currentlySelectedTreeNode.data.Editing === undefined
      ? false
      : this.currentlySelectedTreeNode.data.Editing;
  }

  set currentlySelectedTreeNodeEditing(toSet: boolean) {
    console.log("L", this.currentlySelectedTreeNode);
    if (this.currentlySelectedTreeNode) {
      this.currentlySelectedTreeNode.data.Editing = toSet;
    }
  }

  onRenameNode(event: Event) {
    this.currentlySelectedTreeNodeEditing = !this.currentlySelectedTreeNodeEditing;

    if (this.currentlySelectedTreeNodeEditing) {
      setTimeout(() => {
        this.CodBi_LocalAPIDoc_Tree_Rename_Input.nativeElement.focus();
      });
    }
  }
  ngOnInit() {
    this.translocoService.setActiveLang(this.language);
  }
  ngAfterViewInit() {
    if (this.items && this.items.length > 0) {
      this.currentlySelectedTreeNode = this.items[0];
    }

    this.CodBi_LocalAPIDoc_Add.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "flex";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.add("-submerged");
      this.CodBi_LocalAPIDoc_New_Name.nativeElement.focus();
    });

    this.CodBi_LocalAPIDoc_New_Panel_Close.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    });

    this.CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue.nativeElement.addEventListener("change", (event) => {
      console.log("ZX");
      const file = (event.target as HTMLInputElement).files?.[0]; // Get the first selected file

      if (file) {
        const reader = new FileReader();
        console.log("ZXFile", file);
        reader.onload = (e) => {
          console.log("ZXLoaded");
          try {
            const fileContent = e.target?.result as string;
            // Parse the JSON string back into JavaScript objects
            const parsedData: InputData = JSON.parse(fileContent);

            const convertedData = this.mergeDataIntoStructuredTree(parsedData, {
              detElementplaceholder: this.itemsElementplaceholder,
              detFunctionalities: this.items,
              detStandards: this.itemsStandard,
            });
            console.log("N", parsedData, convertedData);

            this.itemsStandard = convertedData.detStandards;
            this.items = convertedData.detFunctionalities;
            this.itemsElementplaceholder = convertedData.detElementplaceholder;

            console.log("Niconverted", convertedData);
          } catch (error) {
            console.error("Error parsing JSON file:", error);
          }
        };

        reader.readAsText(file);
      }
    });
  }

  onClick_CodBi_LocalAPIDoc_RightPanel_AddParameter(toAdd: string) {
    (toAdd === undefined || toAdd.toLowerCase() === "parameter"
      ? this.currentlySelectedFunctionalityData.Parameter
      : toAdd.toLowerCase() === "classes"
        ? this.currentlySelectedFunctionalityData.classes
        : this.currentlySelectedFunctionalityData.globals
    ).push(new CommonApiParameter("Neuer Parameter...", "Keine Beschreibung..."));
  }
}
