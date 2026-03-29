// #region Imports
// #region Types
// #region Angular
import type { AfterViewInit } from "@angular/core";
import type { Observable } from "rxjs";
// #endregion Angular
// #region PrimeNG
import type { TreeFilterEvent, TreeNodeSelectEvent } from "primeng/tree";
import type { TreeNode } from "primeng/api";
// #endregion PrimeNG
// #region Transloco
import type { Translation, TranslocoLoader } from "@ngneat/transloco";
// #endregion Transloco
import type { TMessageKey } from "codbi-common";
// #endregion Types
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-designer";
import { i18n } from "../../../../../../../../src/js/i18n";
// #endregion XIMA
// #region Angular
// biome-ignore lint/style/useImportType: Need ChangeDetectorRef as an injection token.
import { ChangeDetectorRef, Component, ViewEncapsulation, Input, ViewChild, ElementRef } from "@angular/core";
// biome-ignore lint/style/useImportType: Need HttpClient as an injection token.
import { HttpClient } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { Injectable } from "@angular/core";
// #endregion Angular
// #region PrimeNG
import { type Tree, TreeModule } from "primeng/tree";
import { TabsModule } from "primeng/tabs";
import { type Splitter, SplitterModule } from "primeng/splitter";
import { AccordionModule } from "primeng/accordion";
import { TagModule } from "primeng/tag";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
// #endregion PrimeNG
// #region TinyMCE
import { EditorModule, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";
// #endregion TinyMCE
// #region Transloco
// biome-ignore lint/style/useImportType: Need TranslocoService as an injection token.
import { TranslocoService } from "@ngneat/transloco";
import { TranslocoPipe, TranslocoModule } from "@ngneat/transloco";
// #endregion Transloco
// #region ZOD
import { json, parse, set, z } from "zod";
// #endregion ZOD
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { ZOD } from "xdbc/src/DBC/ZOD";
// #endregion XDBC
// #endregion Imports
// #region Interfaces
/** Defines a contract for {@link object }s representing API-Doc Parameter. */
interface ApiParameter {
  /** The parameter's name. */
  Name: string;
  /** The parameter description. */
  Description: string;
  /** The parameter's id. */
  id: number;
}
/** Defines a contract for an imported, or from the CodBi-Resourceservlet loaded, local API-Documentation. */
interface ImportedApiDoc {
  /** The details to CodBi Standard Configurations. */
  detStandards: {
    [key: string]: {
      /** The standard's description. */
      Description: string;
      /** The global variables defined by the standard. */
      globals: ApiParameter[];
      /** The CSS-Classes parameters defined by the standard. */
      classes: ApiParameter[];
    };
  };
  /** The details to CodBi Functionalities. */
  detFunctionalities: { [key: string]: { Description: string; Parameter: ApiParameter[] } };
  /** The details to CodBi Elementplaceholder. */
  detElementplaceholder: { [key: string]: { Description: string; Parameter: ApiParameter[] } };
  /** Stores incoming API-Doc-Data in a way that is more appropriate for JSON.*/
  docsAPI: [{ [key: string]: string }];
  /** The files containing the actual code for CodBi Standard-Configurations. */
  fileListing: Array<string>;
  /** The files containing the actual code for CodBi Elementplaceholder. */
  fslElementplaceholder: Array<string>;
  /** The files containing the actual code for CodBi Functionalities. */
  fslFunctionalities: Array<string>;
}
/**
 * Defines a contract for {@link object }s representing a {@link TreeNode.data } suitable for the representation
 * of a local API-Doc entry. */
interface TreeNodeData {
  /** The {@link TreeNode.label } duplicated for internal processment. */
  label: string;
  /** The Description of either the represented functionality, elementplaceholder or standard configuration. */
  Description: string;
  /** The CSS-Classes defined, if we're dealing with a CodBi Standard Configuration. */
  classes: ApiParameter[];
  /** The global Variables defined, if we're dealing with a CodBi Standard Configuration. */
  globals: ApiParameter[];
  /** The parameter defined, if we're dealing with either a CodBi Functionality or an Elementplaceholder. */
  Parameter: ApiParameter[];
  /** The optional internal Notes. */
  Notes: string;
  /** Whether this node was imported during the current session. */
  Imported?: boolean;
}
/** Defines a contract for elements of the {@link APIDocJSON }s. */
interface InputDataItem {
  /** The Description of either the represented functionality, elementplaceholder or standard configuration. */
  Description?: string;
  /** The global Variables defined, if we're dealing with a CodBi Standard Configuration. */
  globals?: { [name: string]: string } | SimplifiedNamedItem[];
  /** The CSS-Classes defined, if we're dealing with a CodBi Standard Configuration. */
  classes?: { [name: string]: string } | SimplifiedNamedItem[];
  /** The parameter defined, if we're dealing with either a CodBi Functionality or an Elementplaceholder. */
  Parameter?: { [name: string]: string } | SimplifiedNamedItem[];
  /** Stores the JS-Code for that CodBi-Element. */
  Code: string | undefined;
}
/** Defines a contract for {@link object }s that represent local API Documentation to be merged to already existing one. */
interface APIDocJSON {
  /** The CodBi Standard-Configurations defined. */
  detStandards?: { [key: string]: InputDataItem };
  /** The CodBi Functionalities defined. */
  detFunctionalities?: { [key: string]: InputDataItem };
  /** The CodBi Elementplaceholder defined. */
  detElementplaceholder?: { [key: string]: InputDataItem };
  /** Stores incoming API-Doc-Data in a way that is more appropriate for JSON.*/
  docsAPI?: string[];
  /** The files containing the actual code for CodBi Standard-Configurations. */
  fileListing?: string;
  /** The files containing the actual code for CodBi Elementplaceholder. */
  fslElementplaceholder?: string;
  /** The files containing the actual code for CodBi Functionalities. */
  fslFunctionalities?: string;
}
/** Defines a contract for local API-Docs that may be merged with others. */
interface APIDoc_MergeableTreeNode {
  /** The defined CodBi Standard Configurations's details. */
  detStandards?: TreeNode[];
  /** The defined CodBi Standard Functionality's details. */
  detFunctionalities?: TreeNode[];
  /** The defined CodBi Standard Element Placeholder's details. */
  detElementplaceholder?: TreeNode[];
  /** Stores incoming API-Doc-Data in a way that is more appropriate for JSON.*/
  docsAPI?: TreeNode[];
  /** The files containing the actual code for CodBi Standard-Configurations. */
  fileListing?: string[];
  /** The files containing the actual code for CodBi Elementplaceholder. */
  fslElementplaceholder?: string[];
  /** The files containing the actual CodBi Functionalitie's code. */
  fslFunctionalities?: string[];
  /** Further top-level {@link TreeNode }s. */
  [key: string]: TreeNode[] | string[] | undefined;
}
/** A contract for {@link object }s describing a CodBi-Functionality, -Elementplaceholder or -Standard Configuration.*/
interface SimplifiedNamedItem {
  /** The CodBi-Element's name. */
  Name?: string;
  /** The CodBi-Element's description. */
  Description?: string;
  /** The CodBi-Element's further properties. */
  [key: string]: unknown;
}
// #endregion Interfaces
// #region Classes
// #region Transloco
@Injectable({
  providedIn: "root",
})
/** The {@link TranslocoLoader } acquiring the translations via the CodBi-Resourceservlet. */
export class TranslocoHttpLoader implements TranslocoLoader {
  /** Stores the reference to the injected {@link HttpClient }. */
  protected httpClient: HttpClient | undefined;
  /**
   * Creates this {@link TranslocoHttpLoader } by sett the {@link TranslocoHttpLoader.httpClient } to use.
   *
   * @param httpClient The {@link HttpClient } provided by Angular. */
  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Fetches the translation file for a given language and optional scope.
   *
   * @param lang  The language {@link string }-code (e.g., 'en', 'es').
   *
   * @returns An {@link Observable } that emits the {@link Translation }-JSON. */
  getTranslation(lang: string): Observable<Translation> {
    return this.httpClient.get<Translation>(
      `${window.location.href.split("/").slice(0, 4).join("/")}/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/i18n/LocalAPIDocManager/${lang}.json`,
    );
  }
}
// #endregion Transloco
// #region Helper
/** An actual {@link ApiParameter }-Implementation. */
class CommonApiParameter implements ApiParameter {
  /** See {@link ApiParameter.Name }. */
  Name: string = "";
  /** See {@link ApiParameter.Description }. */
  Description: string = "";
  /** See {@link ApiParameter.id }. */
  id: number;
  /**
   * Creates this {@link ApiParameter } by setting it's {@link ApiParameter.Name },
   * {@link ApiParameter.Description } and a {@link Math.random } id.
   *
   * @param name        The {@link ApiParameter.Name }.
   * @param description The {@link ApiParameter.Description }.
   * @param id          The optional {@link ApiParameter.id } that will be generate {@link Math.random }ly,
   *                    if omitted. */
  constructor(name: string, description: string, id: number = Math.random()) {
    this.Name = name;
    this.Description = description;
    this.id = id;
  }
}
// #endregion Helper
/**
 * A dialogue providing the means to manage persistent local CodBi API documentation.
 * Overall export/import is available for backup.
 * Specific export/import is available in order to facilitate sharing of code.
 * Promoting CodBi-GitHub for contribution. */
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
      useValue: `${window.location.href.split("/").slice(0, 4).join("/")}/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce/tinymce.min.js`,
    },
  ],
  templateUrl: "./manager.html",
  styleUrl: "./manager.scss",
  encapsulation: ViewEncapsulation.None,
})
export class Manager implements AfterViewInit {
  // #region Layout
  /** The {@link Splitter } constituting the two main areas of this {@link Manager }. */
  @ViewChild("Splitter") Splitter!: Splitter;
  /**
   * Handles the Resizing of the {@link Manage.Splitter } by storing it's {@link Splitter.panelSizes } into the
   * {@link localStorage } in order to restore it when this {@link Manager } gets constructed.
   *
   * @param event As provided by Angular. */
  protected onMainPanelResize() {
    localStorage.setItem("CodBi_LocalAPIDocManager_Splitter_PanelSizes", JSON.stringify(this.Splitter.panelSizes));
  }
  // #endregion Layout
  // #region Component References
  @ViewChild("CodBi_LocalAPIDoc", { read: ElementRef }) CodBi_LocalAPIDoc!: ElementRef;
  // #endregion Component References
  // #region Node Management
  /**
   * Sets {@link Manager.filtering } accordingly.
   *
   * @param event As provided by Angular. */
  protected onFilterNodes(event: TreeFilterEvent) {
    this.filtering = event.filter !== "";
  }
  /**
   * Sets the expanded state of the {@link TreeNode } to start at up to the topmost one to the value **toSet**.
   *
   * @param toSet The state to set on the {@link TreeNode }s.
   * @param start The {@link TreeNode } where to start setting at. */
  protected setStateToTopmost(toSet: boolean, start: TreeNode) {
    do {
      start.expanded = toSet;
      // biome-ignore lint/style/noParameterAssign: N/A
      start = start.parent;
    } while (start !== undefined);
  }
  /** States whether the {@link Manager.CodBi_LocalAPIDoc_Tree } is currently filtering or not. */
  protected filtering: boolean = false;
  /**
   * Retrieves all children of the {@link TreeNode } specified.
   *
   * @param from The {@link TreeNode } tmo retrieve the children from.
   *
   * @returns The requested {@link Array < TreeNode >}. */
  protected retrieveChildnodes(from: TreeNode): Array<TreeNode> {
    const result = new Array<TreeNode>();

    for (const child of from.children) {
      result.push(child);

      for (const furtherChild of this.retrieveChildnodes(child)) {
        result.push(furtherChild);
      }
    }

    return result;
  }
  // #region New Node Dialog
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Add") CodBi_LocalAPIDoc_New_Panel_Add!: ElementRef;
  @ViewChild("CodBi_LocalAPIDoc_New") CodBi_LocalAPIDoc_New!: ElementRef;
  @ViewChild("CodBi_LocalAPIDoc_Add") CodBi_LocalAPIDoc_Add!: ElementRef;
  @ViewChild("CodBi_LocalAPIDoc_New_Name") CodBi_LocalAPIDoc_New_Name!: ElementRef;
  // #region Create New Element
  /**
   * The {@link HTMLParagraphElement } stating that the local CodBi-Element to created with the specified
   * {@link Manager.CodBi_LocalAPIDoc_New_Name } is already taken by a native CodBi-Element. */
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent")
  CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent!: ElementRef;
  /* The {@link HTMLParagraphElement } stating that no elements ending with "_imported" are "_importiert" are allowed. */
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Name_Hint_Systemidentifier")
  CodBi_LocalAPIDoc_New_Panel_Name_Hint_Systemidentifier!: ElementRef;
  /** Simulates a click on {@link Manager.CodBi_LocalAPIDoc_New_Panel_Add } in order to add a new element. */
  protected onEnter_CodBi_LocalAPIDoc_New_Name() {
    this.CodBi_LocalAPIDoc_New_Panel_Add.nativeElement.click();
  }
  /**
   * Adds the {@link TreeNode }s specified in the given path to the structure {@link toAddTo } inserting the new
   * {@link TreeNode }s into already existing ones (case insensitive).
   *
   * @param path  The {@link TreeNodes } to create.
   * @param addTo The structure the **path**'s {@link TreeNodes } shall be added to. */
  protected addTreeNodes(path: string, addTo: TreeNode<TreeNodeData>[]) {
    let currentNodelevel: TreeNode<TreeNodeData>[] = addTo;

    for (const part of path.split(".")) {
      let existent = false;
      // #region Check for already existing nodes and insert accordingly
      for (const node of currentNodelevel) {
        if (node.label.toLowerCase() === part.toLowerCase()) {
          existent = true;
        }
      }

      if (!existent) {
        currentNodelevel.push({
          label: part,
          data: {
            label: part,
            Description: "",
            globals: [],
            classes: [],
            Parameter: [],
            Notes: "Neu Erstellt",
          },
          children: [],
        });
      }
      // #endregion Check for already existing nodes and insert accordingly
      currentNodelevel = currentNodelevel.find(
        (candidate) => candidate.label.toLowerCase() === part.toLowerCase(),
      ).children;
    }
  }
  // #region Checks
  /**
   * Determines if the specified name of a functionality **toCheck** is already taken.
   *
   * @param toCheck The possibly taken name.
   *
   * @returns TRUE if taken, otherwise FALSE. */
  protected isFunctionalityNameTaken(toCheck: string): boolean {
    return Object.keys(window.CodbiPluginData.detFunctionalities)
      .map((e) => e.toLowerCase())
      .includes(toCheck.toLowerCase());
  }
  /**
   * Determines if the specified name of an elementplaceholder **toCheck** is already taken.
   *
   * @param toCheck The possibly taken name.
   *
   * @returns TRUE if taken, otherwise FALSE. */
  protected isElementPlaceholderNameTaken(toCheck: string): boolean {
    return Object.keys(window.CodbiPluginData.detElementplaceholder)
      .map((e) => e.toLowerCase())
      .includes(toCheck.toLowerCase());
  }
  /**
   * Determines if the specified name of an elementplaceholder **toCheck** is already taken.
   *
   * @param toCheck The possibly taken name.
   *
   * @returns TRUE if taken, otherwise FALSE. */
  protected isStandardNameTaken(toCheck: string): boolean {
    return Object.keys(window.CodbiPluginData.detStandards)
      .map((e) => e.toLowerCase())
      .includes(toCheck.toLowerCase());
  }
  /**
   * Determines whether the specified  **pathAndName** is already taken by a native CodBi-Element.
   *
   * @param pathAndName The **pathAndName** to the possibly already natively defined CodBi-Element.
   *
   * @returns **True** if the specified **pathAndName** is already taken, otherwise **false**. */
  protected isNameTaken(pathAndName: string): boolean {
    const lowerCaseName = pathAndName.toLowerCase();

    return Object.keys(
      window.CodbiPluginData[
        this.activeTab === "Functionality"
          ? "detFunctionalities"
          : this.activeTab === "Elementplaceholder"
            ? "detElementplaceholder"
            : "detStandards"
      ],
    )
      .map((e) => e.toLowerCase())
      .includes(lowerCaseName);
  }
  /**
   * Retrieves the topmost parent {@link TreeNode } of the one to retrieve **from**.
   *
   * @param from The {@link TreeNode } to retrieve the topmost parent from.
   *
   * @returns The requested {@link TreeNode }. */
  protected getTopmostParent(from: TreeNode): TreeNode {
    let current = from;

    while (current.parent !== undefined) {
      current = current.parent;
    }

    return current;
  }
  // #endregion Checks
  // #region Adding Nodes
  /**
   * Adds a new node to the {@link Manager.currentlySelectedTreeNode }'s {@link TreeNode.children }.
   *
   * @param event The {@link Event } received. */
  protected onAddNode(event: Event) {
    INSTANCE.tsCheck<HTMLElement>(
      event.target,
      HTMLElement,
    ).parentElement.parentElement.parentElement.parentElement.parentElement.click();

    const newLabel = this.translocoService.translate("Add.NewNode");

    let newIndex = 0;
    // #region Determine current new node index.
    for (const child of this.currentlySelectedTreeNode.children) {
      if (child.label.indexOf(newLabel) !== -1) {
        const childIndex = Number.parseInt(child.label.replace(newLabel, ""));

        if (childIndex > newIndex) {
          newIndex = childIndex;
        }
      }
    }
    // #endregion Determine current new node index.
    this.currentlySelectedTreeNode.children.push({
      label: `${newLabel}${newIndex + 1}`,
      data: {
        label: `${newLabel}${newIndex + 1}`,
        Description: "",
        globals: [],
        classes: [],
        Parameter: [],
        Notes: this.translocoService.translate("RP.Notes.NewCreation"),
      },
      children: [],
    });

    this.currentlySelectedTreeNode.expanded = true;

    this.synchronized = false;

    this.cdr.markForCheck();
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
    if (this.isNameTaken(inputControl.value)) {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "block";

      return;
    } else {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "none";
    }
    // #endregion Check against CodBi Data.
    // #region Check if Systemidentifier used.
    if (inputControl.value.endsWith("_codbi_import")) {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_Systemidentifier.nativeElement.style.display = "block";

      return;
    } else {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_Systemidentifier.nativeElement.style.display = "none";
    }
    // #endregion Check if Systemidentifier used.
    // #region Add new element to the tree and update it.
    this.addTreeNodes(
      this.CodBi_LocalAPIDoc_New_Name.nativeElement.value.toLowerCase(),
      this.activeTab === "Functionality"
        ? this.items
        : this.activeTab === "Elementplaceholder"
          ? this.itemsElementplaceholder
          : this.itemsStandard,
    );

    this._currentlySelectedTreeNode = this.activeTabItems[this.activeTabItems.length - 1];
    this._currentNodeData = this.activeTabItems[this.activeTabItems.length - 1].data;
    this.synchronized = false;

    this.cdr.markForCheck();
    // #endregion Add new element to the tree and update it.
    // #region Close the dialog.
    this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";

    (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    // #endregion Close the dialog.
  }
  /**
   * Clears the {@link Manager.formerInput_CodBi_LocalAPIDoc_New_Name }
   * @param event
   */
  protected onClick_CodBi_LocalAPIDoc_Add(event: Event) {
    this.formerInput_CodBi_LocalAPIDoc_New_Name = "";
    this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "flex";
    (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.add("-submerged");
    this.CodBi_LocalAPIDoc_New_Name.nativeElement.focus();
  }
  // #endregion Create New Element
  // #endregion New Node Dialog
  // #region Removal
  /** */
  @ViewChild("CodBi_LocalAPIDoc_Tree_Label_Remove_Question") CodBi_LocalAPIDoc_Tree_Label_Remove_Question!: ElementRef;
  // #endregion Adding Nodes
  /**
   *
   * @param nodes
   * @param dataToRemove
   * @returns
   */
  protected removeNodeRecursive(nodes: TreeNode[] | undefined, dataToRemove: TreeNode): TreeNode[] {
    if (!nodes) {
      return [];
    }

    const newNodes: TreeNode[] = [];

    for (const node of nodes) {
      if (node.key === dataToRemove.key) {
        continue;
      }

      if (node.children && node.children.length > 0) {
        const filteredChildren = this.removeNodeRecursive(node.children, dataToRemove);

        node.children = filteredChildren;
      }

      newNodes.push(node);
    }

    return newNodes;
  }
  /**
   * Removes the node corresponding to the clicked remove button.
   *
   * @param event The {@link Event } received. */
  protected onDeleteNode(event: Event) {
    // #region Update the currently selected node to be the one corresponding to the clicked remove button.
    const node = INSTANCE.tsCheck<HTMLElement>(event.target, HTMLElement).parentElement.parentElement.parentElement
      .parentElement.parentElement;

    node.click();
    // #endregion Update the currently selected node to be the one corresponding to the clicked remove button.
  }
  // #region Code Deletion
  /** Stores the CodBi-Elements that were removed since the last {@link Manager.enSync }. */
  protected removedElements: Array<{ type: "Functionality" | "Elementplaceholder" | "Standard"; path: string }> = [];
  /** Stores the CodBi-Elements that were renamed since the last {@link Manager.enSync }. */
  protected renamedElements: Array<{
    type: "Functionality" | "Elementplaceholder" | "Standard";
    oldPath: string;
    newPath: string;
  }> = [];
  // #endregion Code Deletion
  // #region Data
  /**
   * Retrieves either {@link window.CodbiPluginData.detFunctionalities }, {@link window.CodbiPluginData.detElementplaceholder },
   * {@link window.CodbiPluginData.detStandards } depending on {@link Manager.activeTab },
   *
   * @returns The current CodBi elements details. */
  protected get currentCodBiElements() {
    return window.CodbiPluginData[
      this.activeTab === "Functionality"
        ? "detFunctionalities"
        : this.activeTab === "Elementplaceholder"
          ? "detElementplaceholder"
          : "detStandards"
    ];
  }
  // #endregion Data
  /**
   * Handles the event when the user confirms the deletion of a node.
   *
   * @param event The {@link Event } received. */
  protected onDeleteNode_OK(event: Event) {
    this.CodBi_LocalAPIDoc_Tree_Label_Remove_Question.nativeElement.style.display = "none";
    if (this.filtering) {
      const formerCurrentlySelectedTreeNode = this.CodBi_LocalAPIDoc_Tree.nativeElement.querySelector(
        '.p-tree-node[ aria-selected = "true"] #CodBi_LocalAPIDoc_Tree_Label',
      );

      if (this.CodBi_LocalAPIDoc_Tree_Component.filteredNodes.length === 1) {
        this.CodBi_LocalAPIDoc_Tree_Component.resetFilter();
      }

      formerCurrentlySelectedTreeNode.click();
    }

    switch (this.activeTab) {
      case "Functionality":
        {
          const paths = this.getTreePaths([this._currentNode]);
          const fullNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);
          const base = this.getTreeNodeBase(this._currentNode);

          this.items = this.removeNodeRecursive(this.items, this._currentNode);

          delete window.CodbiPluginData.detFunctionalities[fullNodePath];
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${base === "" ? "" : `${base}.`}${toFilterOut}.js` || e === `${fullNodePath}.js`) {
                return false;
              }

              delete window.CodbiPluginData.detFunctionalities[`${base === "" ? "" : `${base}.`}${toFilterOut}`];
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);

          this.activeTabDocUpdater(this.activeTabDocFSL);
          // #endregion Remove from FSL
          // #region Filter out removed code to be imported en sync.
          for (const toFilterOut of paths) {
            for (const key of this.importedCodeToUpload.keys()) {
              if (key.type === "Functionality" && key.key === toFilterOut) {
                this.importedCodeToUpload.delete(key);
              }
            }
          }
          // #endregion Filter out removed code to be imported en sync.
        }

        break;

      case "Elementplaceholder":
        {
          const paths = this.getTreePaths([this._currentNode]);
          const fullNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);
          const base = this.getTreeNodeBase(this._currentNode);

          this.itemsElementplaceholder = this.removeNodeRecursive(this.itemsElementplaceholder, this._currentNode);

          delete window.CodbiPluginData.detElementplaceholder[fullNodePath];
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${base === "" ? "" : `${base}.`}${toFilterOut}.js` || e === `${fullNodePath}.js`) {
                return false;
              }

              delete window.CodbiPluginData.detElementplaceholder[`${base === "" ? "" : `${base}.`}${toFilterOut}`];
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);
          // #region Filter out removed code to be imported en sync.
          for (const toFilterOut of paths) {
            for (const key of this.importedCodeToUpload.keys()) {
              if (key.type === "Elementplaceholder" && key.key === toFilterOut) {
                this.importedCodeToUpload.delete(key);
              }
            }
          }
          // #endregion Filter out removed code to be imported en sync.
          this.activeTabDocUpdater(this.activeTabDocFSL);
          window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities); // Necessity to update the SVManager, too.
          // #endregion Remove from FSL
        }

        break;

      case "Standard":
        {
          const paths = this.getTreePaths([this._currentNode]);
          const fullNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);
          const base = this.getTreeNodeBase(this._currentNode);

          this.itemsStandard = this.removeNodeRecursive(this.itemsStandard, this._currentNode);

          delete window.CodbiPluginData.detStandards[fullNodePath];
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${base === "" ? "" : `${base}.`}${toFilterOut}.js` || e === `${fullNodePath}.js`) {
                return false;
              }

              delete window.CodbiPluginData.detStandards[`${base === "" ? "" : `${base}.`}${toFilterOut}`];
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);

          window.CodbiPluginData.populateStandards();
          // #endregion Remove from FSL
          // #region Filter out removed code to be imported en sync.
          for (const toFilterOut of paths) {
            for (const key of this.importedCodeToUpload.keys()) {
              if (key.type === "Standard" && key.key === toFilterOut) {
                this.importedCodeToUpload.delete(key);
              }
            }
          }
          // #endregion Filter out removed code to be imported en sync.
          this.activeTabDocUpdater(undefined);
        }

        break;
    }
    // #region Remove corresponding code from server.
    for (const path of this.getTreePaths([this.currentlySelectedTreeNode], true)) {
      this.removedElements.push({ type: this.activeTab, path: path });
    }
    // #endregion Remove corresponding code from server.
    if (this.activeTabItems.length !== 0) {
      this._currentlySelectedTreeNode = this.activeTabItems[this.activeTabItems.length - 1];
    } else {
      this._currentlySelectedTreeNode = undefined;
    }

    this.synchronized = false;
  }
  /**
   * Handles the event when the user cancels the deletion of a node.
   *
   * @param event The {@link Event } received.
   */
  protected onDeleteNode_CANCEL(event: Event) {
    this.CodBi_LocalAPIDoc_Tree_Label_Remove_Question.nativeElement.style.display = "none";
  }
  // #endregion Removal
  // #region Code Upload
  /** References the Upload-File-{@link HTMLInputElement }. */
  @ViewChild("CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue")
  CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue!: ElementRef;
  /** References the Sync-Button. */
  @ViewChild("CodBi_LocalAPIDoc_RightPanel_Options_Sync") CodBi_LocalAPIDoc_RightPanel_Options_Sync!: ElementRef;
  /** States whether the "Changed"-Eventlistener for {@link Manager.CodBi_LocalAPIDoc_Tree_Label_Upload_Code } has been registered or not.*/
  protected changedListenerRegistered_CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue = false;
  /**
   * Opens the {@link Manager.CodBi_LocalAPIDoc_Tree_Label_Upload_Code } to select the code to upload.
   *
   * @param event The {@link Event } received. */
  protected onUploadCode(event: Event) {
    this.CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue.nativeElement.value = ""; // So that the listener will fire even when same file was selected again.
    // #region Code Upload
    if (!this.changedListenerRegistered_CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue) {
      this.CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue.nativeElement.addEventListener("change", (event) => {
        const fullNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);
        const file = (event.target as HTMLInputElement).files?.[0];

        if (file) {
          this.synchronizing = true;

          const reader = new FileReader();

          reader.onload = (e) => {
            let fileContent = e.target?.result as string;
            const activeTab = this.activeTab; // Closure.
            // #region Replace window.codbi identifiers with the actual node path.
            const nodePath = fullNodePath.toLowerCase();

            fileContent = fileContent.replace(
              /(window\.codbi\.(?:registerFunctionality|registerEP|extendFunctionality|extendEP))\(\s*(["'`])(?:(?!\2).)*\2/g,
              `$1($2${nodePath}$2`,
            );
            // #endregion Replace window.codbi identifiers with the actual node path.

            this.importedCodeToUpload.set({ type: this.activeTab, key: fullNodePath }, () => {
              return new Promise<void>((resolve, reject) => {
                getJQuery().ajax({
                  url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
                  type: "POST",
                  headers: {
                    "X-Action": "Update Code",
                    "X-ActionDetail": activeTab,
                    "X-Element": fullNodePath,
                  },
                  data: {
                    ToWrite: fileContent,
                  },
                  success: (response) => {
                    window.CodbiPluginData.localCode = `${window.CodbiPluginData.localCode}${window.CodbiPluginData.localCode.length !== 0 ? "," : ""}${activeTab}_${fullNodePath}`;

                    this.cdr.markForCheck();
                    resolve();
                  },
                });
              });
            });

            if (this.currentCodBiElements[fullNodePath] === undefined) {
              this.currentCodBiElements[fullNodePath] = {
                Active: true,
                Description: this.translocoService.translate("Add.NewNode.ViaCodeUpload"),
                // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
                Code: (this.currentlySelectedTreeNode.data.Code = fileContent),
                local: true,
              };
            }

            if (!this.currentlySelectedTreeNode.data.Description) {
              this.currentlySelectedTreeNode.data.Description =
                this.translocoService.translate("Add.NewNode.ViaCodeUpload");
            }

            switch (activeTab) {
              case "Elementplaceholder": {
                const epArr = JSON.parse(window.CodbiPluginData.fslElementplaceholder) as string[];
                const epEntry = `${fullNodePath}.js`;
                if (!epArr.includes(epEntry)) {
                  epArr.push(epEntry);
                  window.CodbiPluginData.fslElementplaceholder = JSON.stringify(epArr);
                }

                window.CodbiPluginData.updateEPManager(window.CodbiPluginData.fslElementplaceholder);

                break;
              }
              case "Functionality": {
                window.CodbiPluginData.detFunctionalities[fullNodePath].Parameter = {};

                const fnArr = JSON.parse(window.CodbiPluginData.fslFunctionalities) as string[];
                const fnEntry = `${fullNodePath}.js`;
                if (!fnArr.includes(fnEntry)) {
                  fnArr.push(fnEntry);
                  window.CodbiPluginData.fslFunctionalities = JSON.stringify(fnArr);
                }

                window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities);

                break;
              }
              case "Standard":
                window.CodbiPluginData.detStandards[fullNodePath].classes = {};
                window.CodbiPluginData.detStandards[fullNodePath].globals = {};

                break;
            }

            this.updateNodeToAPIDoc();

            if (this.currentCodBiElements[fullNodePath] !== undefined) {
              this.currentCodBiElements[fullNodePath].Code = this.currentlySelectedTreeNode.data.Code = fileContent;
            }

            this.synchronizing = false;
            this.synchronized = false;

            this.cdr.markForCheck();
          };

          reader.readAsText(file);
        }
      });

      this.changedListenerRegistered_CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue = true;
    }
    // #endregion Code Upload
    this.CodBi_LocalAPIDoc_Tree_Label_UploadCode_Dialogue.nativeElement.click();
  }
  // #endregion Code Upload
  // #region Code Deletion (per node, keeping the node itself)
  /**
   * Deletes the code associated with the currently selected tree node without removing the node.
   *
   * @param event The {@link Event } received. */
  protected onDeleteCode(event: Event) {
    INSTANCE.tsCheck<HTMLElement>(
      event.target,
      HTMLElement,
    ).parentElement.parentElement.parentElement.parentElement.parentElement.click();

    const fullNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);

    // Clear code from the node data.
    if (this.currentlySelectedTreeNode.data) {
      this.currentlySelectedTreeNode.data.Code = undefined;
      this.currentlySelectedTreeNode.data.code = undefined;
    }

    // Clear code from the plugin data reference.
    if (this.currentCodBiElements[fullNodePath]) {
      this.currentCodBiElements[fullNodePath].Code = undefined;
    }

    // Remove any pending upload for this element.
    for (const key of this.importedCodeToUpload.keys()) {
      if (key.type === this.activeTab && key.key === fullNodePath) {
        this.importedCodeToUpload.delete(key);
      }
    }

    // Mark for server-side deletion on next sync.
    this.removedElements.push({ type: this.activeTab, path: fullNodePath });

    // Remove from localCode tracking.
    const localCodeSuffix = `${this.activeTab}_${fullNodePath}`;
    if (window.CodbiPluginData.localCode) {
      window.CodbiPluginData.localCode = window.CodbiPluginData.localCode
        .split(",")
        .filter((entry) => entry !== localCodeSuffix)
        .join(",");
    }

    this.synchronized = false;
    this.cdr.markForCheck();
  }
  // #endregion Code Deletion (per node, keeping the node itself)
  // #endregion Code Upload
  // #region Renaming
  /** Removes all intermediate renaming steps within the specified {@link Array<{ type: string ; oldPath: string; newPath: string }>} **toConsolidate**.
   *
   * @param toConsolidate The {@link Array<{ type: string ; oldPath: string; newPath: string }>} containing all renaming steps to consolidate.
   *
   * @returns The consolidated {@link Array<{ type: string ; oldPath: string; newPath: string }>} with all intermediate renaming steps removed. */
  protected consolidateRenames(
    renames: Array<{ oldPath: string; newPath: string; type: string }>,
  ): Array<{ oldPath: string; newPath: string; type: string }> {
    const finalStateMap = new Map<string, { finalPath: string; type: string }>();
    const reverseMap = new Map<string, string>();

    for (const op of renames) {
      const { oldPath, newPath, type } = op;

      if (reverseMap.has(oldPath)) {
        const originalOldPath = reverseMap.get(oldPath);

        finalStateMap.set(originalOldPath, {
          finalPath: newPath,
          type: type,
        });

        reverseMap.delete(oldPath);
        reverseMap.set(newPath, originalOldPath);
      } else {
        finalStateMap.set(oldPath, {
          finalPath: newPath,
          type: type,
        });
        reverseMap.set(newPath, oldPath);
      }
    }

    const finalRenames: Array<{ oldPath: string; newPath: string; type: string }> = [];
    for (const [originalOldPath, state] of finalStateMap.entries()) {
      if (originalOldPath !== state.finalPath) {
        finalRenames.push({
          oldPath: originalOldPath,
          newPath: state.finalPath,
          type: state.type,
        });
      }
    }

    return finalRenames;
  }
  /**
   *  Provides access to the {@link HTMLParagraphElement } stating that the name chosen for renaming is already taken
   *  by a native CodBi-Element. */
  @ViewChild("CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent")
  CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent!: ElementRef;
  /**
   * Enables passthrough for the Arrow-Left & -Right key.
   *
   * @param event The received {@link KeyboardEvent }. */
  protected onKeydownRenameInput(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.stopImmediatePropagation();
      event.stopPropagation();

      return;
    }
  }
  /**
   * Updates the {@link Manager.currentlySelectedTreeNode }'s {@link TreeNode.label } and
   * {@link Manager.currentlySelectedTreeNodeEditing } to false, ending editing mode, if the "Enter"-Key is pressed.
   *
   * @param event The received {@link KeyboardEvent }. */
  protected onKeyupRenameInput(event: KeyboardEvent) {
    const lowercaseInputControlValue = INSTANCE.tsCheck<HTMLInputElement>(
      event.target,
      HTMLInputElement,
    ).value.toLowerCase();
    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
    // #region Suppress invalid characters.
    if (
      (inputControl.value !== "" && !/^[a-zA-Z0-9$][a-zA-Z0-9\-\,$\_]*$/.test(inputControl.value)) ||
      inputControl.value.endsWith("_codbi_import")
    ) {
      inputControl.value = this.formerInput_CodBi_LocalAPIDoc_New_Name;
    } else {
      this.formerInput_CodBi_LocalAPIDoc_New_Name = inputControl.value;
    }
    // #endregion Suppress invalid characters.
    if (event.key === "Enter") {
      this.currentlySelectedTreeNode.label = TYPE.tsCheck<HTMLInputElement>(
        event.target,
        typeof HTMLInputElement,
      ).value;
      this.currentlySelectedTreeNodeEditing = false;
    }
  }
  /**
   *  Gets a {@link boolean } stating whether the {@link Manager.currentlySelectedTerrNode }'s {@link TreeNode.label }
   *  is currently being edited or not. */
  protected get currentlySelectedTreeNodeEditing() {
    // #region Prevent access failures.
    if (
      this.currentlySelectedTreeNode === null ||
      this.currentlySelectedTreeNode === undefined ||
      this.currentlySelectedTreeNode.data === null ||
      this.currentlySelectedTreeNode.data === undefined
    ) {
      return false;
    }
    // #endregion Prevent access failures.
    return this.currentlySelectedTreeNode.data.Editing === undefined
      ? false
      : this.currentlySelectedTreeNode.data.Editing;
  }
  /**
   * Sets the {@link Manager.currentlySelectedTreeNode }'s {@link TreeNode.data.Editing } to the given value, stating
   * whether the name of the node is currently being edited or not.
   *
   * @param toSet The {@link boolean } to set. */
  protected set currentlySelectedTreeNodeEditing(toSet: boolean) {
    if (this.currentlySelectedTreeNode) {
      this.currentlySelectedTreeNode.data.Editing = toSet;
    }
  }
  /**
   *  Stores the result of {@link this.getFullNodePath } with the {@link this.currentlySelectedTreeNode } as the
   *  parameter when {@link onRenameNode } was invoked the last time. */
  protected formerTreeNodePath: string | undefined;
  /**
   * Initiates the renaming of the {@link Manager.currentlySelectedTreeNode } by toggling
   * {@link Manager.currentlySelectedTreeNodeEditing } also focusing the {@link Manager.currentlySelectedTreeNode }.
   *
   * @param event The {@link Event } received. */
  protected onRenameNode(event: Event) {
    INSTANCE.tsCheck<HTMLElement>(
      event.target,
      HTMLElement,
    ).parentElement.parentElement.parentElement.parentElement.parentElement.click();

    this.formerTreeNodePath = this.getFullNodePath(this.currentlySelectedTreeNode);
    this.currentlySelectedTreeNodeEditing = !this.currentlySelectedTreeNodeEditing;

    if (this.currentlySelectedTreeNodeEditing) {
      setTimeout(() => {
        this.CodBi_LocalAPIDoc_Tree_Rename_Input.nativeElement.focus();
      });
    }
  }
  /**
   * Traverses up the tree from the given node, collecting all labels into a string,
   * separated by dots, up to the root.
   *
   * @param node The starting {@link TreeNode}.
   * @returns A string representing the path of labels, separated by dots.
   */
  protected getFullNodePath(node: TreeNode): string {
    let path = node.label || "";
    let parent = node.parent;

    while (parent) {
      path = `${parent.label}.${path}`;
      parent = parent.parent;
    }

    return path;
  }
  /**
   * Retrieves the dotted path to the specified {@link TreeNode } **toGetFrom**.
   *
   * @param toGetFrom The {@link TreeNode } to determine the dotted path leading to it from.
   *
   * @returns The requested dotted path. */
  protected getTreeNodeBase(toGetFrom: TreeNode): string {
    let result = "";

    while (toGetFrom.parent) {
      result = `${toGetFrom.parent.parent ? "." : ""}${toGetFrom.parent.label}${result}`;
      // biome-ignore lint/style/noParameterAssign: OMG!
      toGetFrom = toGetFrom.parent;
    }

    return result;
  }
  /**
   * Traverses a TreeNode array and returns all possible paths from the root to every node in the tree.
   * A path is a dot-separated string of node labels.
   *
   * @param nodes The array of TreeNodes to traverse.
   * @param fullPathMode If true, returns only full paths to leaf nodes; if false, returns relative paths to all nodes.
   *
   * @returns An array of strings, where each string is a full or partial path. */
  protected getTreePaths(nodes: TreeNode[], fullPathMode = false): string[] {
    const allPaths: string[] = [];
    const findPathsRecursive = (node: TreeNode, currentPath: string) => {
      const newPath = currentPath ? `${currentPath}.${node.label}` : (node.label ?? "");

      if (!node.children || node.children.length === 0) {
        allPaths.push(newPath);
      } else {
        allPaths.push(newPath);
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          findPathsRecursive(child, newPath);
        }
      }
    };

    if (nodes) {
      for (const node of nodes) {
        if (fullPathMode) {
          const fullPath = this.getFullNodePath(node);

          findPathsRecursive(
            node,
            fullPath.indexOf(".") === -1 ? "" : fullPath.substring(0, fullPath.lastIndexOf(".")),
          );
        } else {
          findPathsRecursive(node, "");
        }
      }
    }

    return allPaths;
  }
  /**
   * Finds a TreeNode within a given array of nodes based on a dot-separated path.
   * The search is case-insensitive.
   *
   * @param nodes The array of TreeNodes to search in.
   * @param pathParts The parts of the path to follow.
   * @returns The found TreeNode, or `undefined` if not found.
   */
  private findNodeInTree(nodes: TreeNode[], pathParts: string[]): TreeNode | undefined {
    if (!nodes) {
      return undefined;
    }
    let currentNodes: TreeNode[] = nodes;
    let foundNode: TreeNode | undefined = undefined;

    for (const part of pathParts) {
      foundNode = currentNodes.find((node) => node.label?.toLowerCase() === part.toLowerCase());
      if (foundNode) {
        currentNodes = foundNode.children || [];
      } else {
        return undefined; // Part of the path not found
      }
    }
    return foundNode;
  }
  /**
   * Finds a TreeNode within the component's trees (`items`, `itemsElementplaceholder`, `itemsStandard`)
   * based on a dot-separated path.
   *
   * @param path The dot-separated path to the node (e.g., "date.frame.celsius").
   * @returns The found TreeNode, or `undefined` if no node matches the path.
   */
  protected findNodeByPath(path: string): TreeNode | undefined {
    const pathParts = path.split(".");

    return (
      this.findNodeInTree(this.items, pathParts) ||
      this.findNodeInTree(this.itemsElementplaceholder, pathParts) ||
      this.findNodeInTree(this.itemsStandard, pathParts)
    );
  }
  /**
   * Gets the full path of the currently selected tree node as a dot-separated string.
   *
   * @returns A string representing the full path of the currently selected tree node. */
  public get currentlySelectedTreeNodePath(): string {
    return this.getFullNodePath(this.currentlySelectedTreeNode);
  }
  /**
   * Gets the currently selected tree node's API reference object corresponding to the {@link Manager.activeTab }.
   *
   * @returns The API reference object for the currently selected tree node.
   */
  public get currentlySelectedTreeNodeAPIRef() {
    return this.activeTabDocRef[this.currentlySelectedTreeNodePath];
  }
  /**
   * Converts a {@link TreeNode } to an object representation, suitable for API documentation.
   *
   * @param node The {@link TreeNode } to convert.
   * @param type The type of the resulting object, which can be "Functionality", "Elementplaceholder", or "Standard".
   *
   * @returns The requested object representation of the {@link TreeNode }. */

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  convertSingleNode(node: TreeNode, type: "Functionality" | "Elementplaceholder" | "Standard"): any {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const result: any = {};

    if (type === "Standard") {
      result.Description = node.data ? node.data.Description : "";
      result.globals =
        node.data?.globals && node.data.globals.length !== 0 ? this.arrayToObject(node.data.globals) : [];
      result.classes =
        node.data?.classes && node.data.classes.length !== 0 ? this.arrayToObject(node.data.classes) : [];
    } else {
      result.Description = node.data ? node.data.Description : "";
      result.Parameter =
        node.data?.Parameter && node.data.Parameter.length !== 0
          ? this.arrayToObject(node.data.Parameter ? node.data.Parameter : [])
          : [];
      result.globals =
        node.data?.globals && node.data.globals.length !== 0 ? this.arrayToObject(node.data.globals) : [];
    }

    return result;
  }
  /**
   * Stores the path and name of an already taken local CodBi-Element in order to be able to display it in an
   * error message. */
  protected alreadyTakenName: string = "";
  /**
   * Gets the currently active tab's documentation reference object.
   *
   * @returns The documentation reference object for the active tab. */
  public get activeTabDocRef(): object {
    return window[this.docPath][
      this.activeTab === "Functionality"
        ? "detFunctionalities"
        : this.activeTab === "Elementplaceholder"
          ? "detElementplaceholder"
          : "detStandards"
    ];
  }
  /**
   * Gets either the file listing, element placeholder, or functionality depending on the currently
   * {@link Manager.activeTab }. */
  public get activeTabDocFSL(): string {
    return window[this.docPath][
      this.activeTab === "Functionality"
        ? "fslFunctionalities"
        : this.activeTab === "Elementplaceholder"
          ? "fslElementplaceholder"
          : "fileListing"
    ];
  }
  /**
   * Gets the currently active external component updater.
   *
   * @returns The requested external component updater. */
  public get activeTabDocUpdater(): (options: string | undefined) => void {
    return window[this.docPath][
      this.activeTab === "Functionality"
        ? "updateSVManager"
        : this.activeTab === "Elementplaceholder"
          ? "updateEPManager"
          : "populateStandards"
    ];
  }
  /**
   * Sets either the file listing, element placeholder, or functionality list depending on the currently
   * {@link Manager.activeTab }. */
  public set activeTabDocFSL(toSet: string) {
    window[this.docPath][
      this.activeTab === "Functionality"
        ? "fslFunctionalities"
        : this.activeTab === "Elementplaceholder"
          ? "fslElementplaceholder"
          : "fileListing"
    ] = toSet;
  }
  /**
   * Updates the {@link Manager.currentlySelectedTerrNode }'s {@link TreeNode.label } and
   * {@link Manager.currentlySelectedTreeNodeEditing } to false, ending editing mode.
   *
   * @param event The {@link Event } received. */
  protected onBlurRenameInput(event: Event) {
    // #region Do nothing if the name wasn't changed.
    if (this.currentlySelectedTreeNode.label.toLowerCase() === this.formerInput_CodBi_LocalAPIDoc_New_Name) {
      this.currentlySelectedTreeNodeEditing = false;

      return;
    }
    // #endregion Do nothing if the name wasn't changed.
    // #region Do nothing if there's already an element with the same name on the same level.
    const input = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    input.value = input.value.toLowerCase();

    for (const children of this.currentlySelectedTreeNode.parent === undefined
      ? this.currentItems
      : (this.currentlySelectedTreeNode.parent?.children ?? [])) {
      if (
        children !== this.currentlySelectedTreeNode &&
        children.label.toLowerCase() ===
          INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value.toLowerCase()
      ) {
        this.CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent.nativeElement.style.display = "block";

        input.focus();

        setTimeout(() => {
          this.CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent.nativeElement.style.display = "none";
        }, 2000);
        return;
      }
    }
    // #endregion Do nothing if there's already an element with the same name on the same level.
    // #region Mark element for code file renaming.
    this.renamedElements.push({
      type: this.activeTab,
      oldPath: this.formerTreeNodePath,
      newPath: `${this.formerTreeNodePath.indexOf(".") === -1 ? "" : this.formerTreeNodePath.substring(0, this.formerTreeNodePath.lastIndexOf(".") + 1)}${INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value}`,
    });

    for (const child of this.retrieveChildnodes(this.currentlySelectedTreeNode)) {
      this.renamedElements.push({
        type: this.activeTab,
        oldPath: this.getFullNodePath(child),
        newPath: this.getFullNodePath(child).replace(
          this.formerTreeNodePath,
          `${this.formerTreeNodePath.indexOf(".") === -1 ? "" : this.formerTreeNodePath.substring(0, this.formerTreeNodePath.lastIndexOf(".") + 1)}${INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value}`,
        ),
      });
    }
    // #endregion Mark element for code file renaming.
    // #region Build new path
    const newPathBuild: Array<string> = this.currentlySelectedTreeNodePath.split(".");

    newPathBuild[newPathBuild.length - 1] = input.value;

    const newPath = newPathBuild.join(".");
    // #endregion Build new path
    // #region Determine the CodBi-Data to change
    const currentCodBiData =
      window.CodbiPluginData[
        this.activeTab === "Functionality"
          ? "detFunctionalities"
          : this.activeTab === "Elementplaceholder"
            ? "detElementplaceholder"
            : "detStandards"
      ];
    // #endregion Determine the CodBi-Data to change
    // #region Create new entries and remove former ones.
    for (const element in currentCodBiData) {
      if (element === this.currentlySelectedTreeNodePath) {
        currentCodBiData[`${element.replace(this.currentlySelectedTreeNodePath, newPath)}`] = currentCodBiData[element];

        delete currentCodBiData[element];
      } else {
        if (currentCodBiData[element].local) {
          if (
            element.indexOf(this.currentlySelectedTreeNodePath) === 0 &&
            element[this.currentlySelectedTreeNodePath.length] === "."
          ) {
            if (
              element.lastIndexOf(".") !== -1 &&
              element.indexOf(this.currentlySelectedTreeNodePath) !== 0 &&
              element.lastIndexOf(".") + 1 < newPath.length
            ) {
              continue;
            }

            currentCodBiData[`${element.replace(this.currentlySelectedTreeNodePath, newPath)}`] =
              currentCodBiData[element];

            delete currentCodBiData[element];
          }
        }
      }
    }
    // #endregion Create new entries and remove former ones.
    // #region Update Code property identifiers to reflect new paths.
    for (const element in currentCodBiData) {
      const entry = currentCodBiData[element];

      if (entry.Code && entry.local) {
        entry.Code = entry.Code.replace(
          /(window\.codbi\.(?:registerFunctionality|registerEP|extendFunctionality|extendEP))\(\s*(["'`])(?:(?!\2).)*\2/g,
          `$1($2${element}$2`,
        );
      }
    }
    // #endregion Update Code property identifiers to reflect new paths.
    // #region Recreate corresponding FSL properly.
    const jsonCurrentTabDocFSL = JSON.parse(this.activeTabDocFSL);

    for (let i = 0; i < jsonCurrentTabDocFSL.length; i++) {
      const lcJSONCurrentTabDocFSL = jsonCurrentTabDocFSL[i].toLowerCase();
      const lcCurrentlySelectedTreeNodePath = this.currentlySelectedTreeNodePath.toLowerCase();
      // #region Replace only if the [currentlySelectedTreeNodePath] is the element and not just a part of it.
      if (jsonCurrentTabDocFSL[i].toLowerCase() === `${this.currentlySelectedTreeNodePath.toLowerCase()}.js`) {
        jsonCurrentTabDocFSL[i] = jsonCurrentTabDocFSL[i].replace(this.currentlySelectedTreeNodePath, newPath);
      } else {
        if (
          lcJSONCurrentTabDocFSL.indexOf(".") !== -1 &&
          jsonCurrentTabDocFSL[i].toLowerCase() !== `${this.currentlySelectedTreeNodePath.toLowerCase()}.js` &&
          lcJSONCurrentTabDocFSL
            .substring(0, lcJSONCurrentTabDocFSL.lastIndexOf("."))
            .indexOf(lcCurrentlySelectedTreeNodePath) !== -1 &&
          lcJSONCurrentTabDocFSL.replace(".js", "").lastIndexOf(".") !==
            lcCurrentlySelectedTreeNodePath.lastIndexOf(".")
        ) {
          jsonCurrentTabDocFSL[i] = jsonCurrentTabDocFSL[i].replace(this.currentlySelectedTreeNodePath, newPath);
        }
      }
      // #endregion Replace only if the [currentlySelectedTreeNodePath] is the element and not just a part of it.
    }

    this.activeTabDocFSL = JSON.stringify(jsonCurrentTabDocFSL);

    switch (this.activeTab) {
      case "Functionality":
        window.CodbiPluginData.updateSVManager(this.activeTabDocFSL);

        break;
      case "Elementplaceholder":
        window.CodbiPluginData.updateEPManager(this.activeTabDocFSL);

        break;
      case "Standard":
        window.CodbiPluginData.populateStandards();

        break;
    }
    // #endregion Recreate corresponding FSL properly.
    this.synchronized = false;
    this.currentlySelectedTreeNode.data.label = this.currentlySelectedTreeNode.label =
      INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value;
    this.currentlySelectedTreeNodeEditing = false;
  }
  // #endregion Renaming
  // #region Create New Element
  /**
   * Stores the formerly inputted value of {@link Manager.CodBi_LocalAPIDoc_New_Name } in order to restore it
   * whenever an invalid character was entered. */
  protected formerInput_CodBi_LocalAPIDoc_New_Name: string = "";
  /** Stores the label's original value that was the current one when the renaming button was clicked. */
  protected formerInput_CodBi_LocalAPIDoc_New_Name_Original: string = "";
  /**
   * Checks whether the new input of {@link Manager.CodBi_LocalAPIDoc_New_Name } is valid restoring to the
   * {@link Manager.formerInput_CodBi_LocalAPIDoc_New_Name } if not or updating the mentioned property, if so.
   *
   * @param event The {@link Event } that triggered this method. */
  protected onInput_CodBi_LocalAPIDoc_New_Name(event: Event) {
    this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "none";

    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
    // #region Suppress invalid characters.
    if (!/^([a-zA-Z$][\-a-zA-Z0-9$\_]*\.)*[a-zA-Z$\_]*(\.)?$/.test(inputControl.value)) {
      inputControl.value = this.formerInput_CodBi_LocalAPIDoc_New_Name;
    } else {
      this.formerInput_CodBi_LocalAPIDoc_New_Name = inputControl.value;
    }
    // #endregion Suppress invalid characters.
  }
  // #endregion Create New Element
  // #endregion Node Management
  /**
   * Gets the {@link Manager.currentlySelectedTreeNode }'s notes.
   *
   * @returns The requested notes. */
  get notes() {
    return this.currentlySelectedTreeNode?.data ? this.currentlySelectedTreeNode.data.Notes : "";
  }
  /**
   * Sets the notes of the {@link Manager.currentlySelectedTreeNode }.
   *
   * @param notes The notes to set. */
  set notes(toSet: string) {
    if (this.currentlySelectedTreeNode?.data) {
      this.currentlySelectedTreeNode.data.Notes = toSet;
    }
  }
  /** Stores the Base-URL. */
  @Input()
  public baseurl: string = "";
  // #region Import
  /** Handles the click on the right panel's import button by simulating a click on {@link Manager.CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue }. */
  onImport() {
    this.CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue.nativeElement.click();
  }
  // #endregion Import
  // #region Export
  /** Handles the click on the right panel's export button. */
  onExport() {
    // #region Generate data to export.
    const localNodeData = {
      detFunctionalities: this.convertNodes(this.items),
      detElementplaceholder: this.convertNodes(this.itemsElementplaceholder),
      detStandards: this.convertStandardNodes(this.itemsStandard),
    };

    for (const key in localNodeData.detFunctionalities) {
      if (localNodeData.detFunctionalities[key].Description === "") {
        delete localNodeData.detFunctionalities[key];

        continue;
      }

      localNodeData.detFunctionalities[key].Code = window.CodbiPluginData.detFunctionalities[key].Code;
    }

    for (const key in localNodeData.detElementplaceholder) {
      if (localNodeData.detElementplaceholder[key].Description === "") {
        delete localNodeData.detElementplaceholder[key];

        continue;
      }

      localNodeData.detElementplaceholder[key].Code = window.CodbiPluginData.detElementplaceholder[key].Code;
    }

    for (const key in localNodeData.detStandards) {
      if (localNodeData.detStandards[key].Description === "") {
        delete localNodeData.detStandards[key];

        continue;
      }

      localNodeData.detStandards[key].Code = window.CodbiPluginData.detStandards[key].Code;
    }
    // #region Remove entries without description.
    // #endregion Remove entries without description.
    const filelistings = this.enrichData(window[this.docPath], localNodeData);
    const toExport = JSON.stringify({
      fslFunctionalities: filelistings.fslFunctionalities,
      detFunctionalities: localNodeData.detFunctionalities,
      fslElementplaceholder: filelistings.fslElementplaceholder,
      detElementplaceholder: localNodeData.detElementplaceholder,
      detStandards: localNodeData.detStandards,
      fileListing: filelistings.fileListing,
    });
    // #endregion Generate data to export.
    // #region Setup downloader
    const blob = new Blob([toExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "CodBi / Local API-Documentation.json";
    // #endregion Setup downloader
    // #region Activate download & clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    // #endregion Activate download & clean up
  }
  // #endregion Export
  // #region Synchronization
  /** Stores a {@link boolean } stating whether this {@link Manager } is currently synchronized or not. */
  public synchronized = true;
  /** Stores a {@link boolean } stating whether this {@link Manager } is currently synchronizing or not. */
  public synchronizing = false;
  /** Stores whether the current user is allowed to trigger synchronization. */
  public syncAllowed = false;
  /** Marks this {@link Manager } as not to {@link Manager.synchronized }. */
  protected onBlurNotes() {
    this.synchronized = false;
  }
  /**
   * Converts an {@link Array } of { Name: string; Description: string }s into an {@link object } having
   * properties named as the objects in the array and got their value as their **Description**.
   *
   * @param toConvert The {@link Array } of { Name: string; Description: string }s to convert.
   *
   * @returns The requested {@link object }. */
  arrayToObject(toConvert: [{ Name: string; Description: string }]) {
    const result = {};

    for (const element of toConvert) {
      result[element.Name] = element.Description;
    }

    return result;
  }
  /**
   * Convert a tree node reflecting a CodBi Standard Configuration into an {@link object } reflecting one.
   *
   * @param toExtractFrom The {@link TreeNode } to get the data for the resulting object from.
   * @param base          The parent's {@link string } path (for recursion only).
   *
   * @returns The object corresponding to the {@link TreeNode } {@link toExtractFrom }. */
  convertStandardNodes(toExtractFrom: TreeNode[], base: string | undefined = undefined): object {
    const result = {};
    // #region Conversion
    for (const node of toExtractFrom) {
      // #region Fill in necessary structures.
      if (node.data.globals === undefined) {
        node.data.globals = [];
      }

      if (node.data.classes === undefined) {
        node.data.classes = [];
      }
      // #endregion Fill in necessary structures.
      result[`${base ? `${base}.` : ""}${node.label}`] = {
        Description: node.data ? node.data.Description : "",
        globals: node.data ? this.arrayToObject(node.data.globals) : [],
        classes: node.data ? this.arrayToObject(node.data.classes) : [],
      };

      if (node.children) {
        const extractedChildren = this.convertStandardNodes(
          node.children,
          base === undefined ? node.label : `${base}.${node.label}`,
        );

        for (const child in extractedChildren) {
          result[child] = extractedChildren[child];
        }
      }
    }
    // #endregion Conversion
    return result;
  }
  /**
   * Joins the source API-Doc with the destination one.
   *
   * @param destination The source API-Doc.
   * @param source      The destination API-Doc.
   *
   * @returns The FSLs of the functionalities, elementplaceholder and standards. */
  protected enrichData(destination, source) {
    const result = {
      fslFunctionalities: [],
      fslElementplaceholder: [],
      fileListing: [],
    };
    // #region Functionalities
    for (const element in source.detFunctionalities) {
      const lcElementName = element.toLowerCase();

      if (source.detFunctionalities[lcElementName] === undefined) {
        continue;
      }
      // #region Omit elements that are just path segments without any description.
      if (source.detFunctionalities[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
      if (destination.detFunctionalities[lcElementName]) {
        if (source.detFunctionalities[lcElementName]) {
          source.detFunctionalities[lcElementName].Code = destination.detFunctionalities[lcElementName].Code;
        } else {
          source.detFunctionalities[lcElementName] = destination.detFunctionalities[lcElementName];
        }
      }

      document.querySelector('div[is = "xc-epmanager"]').setAttribute(
        "options",
        JSON.parse(
          `${destination.fslFunctionalities.substring(0, destination.fslFunctionalities.length - 1)},\"${element}.js\"]`,
        )
          .map((file: string) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          })
          .join(","),
      );

      result.fslFunctionalities.push(`${element}.js`);

      destination.detFunctionalities[lcElementName] = source.detFunctionalities[element];
      destination.detFunctionalities[lcElementName].local = true;
    }
    // #endregion Functionalities
    // #region Elementplaceholder
    for (const element in source.detElementplaceholder) {
      const lcElementName = element.toLowerCase();

      if (source.detElementplaceholder[lcElementName] === undefined) {
        continue;
      }
      // #region Omit elements that are just path segments without any description.
      if (source.detElementplaceholder[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
      if (destination.detElementplaceholder[lcElementName]) {
        if (source.detElementplaceholder[lcElementName]) {
          source.detElementplaceholder[lcElementName].Code = destination.detElementplaceholder[lcElementName].Code;
        } else {
          source.detElementplaceholder[lcElementName] = destination.detElementplaceholder[lcElementName];
        }
      }

      document.querySelector('div[is = "xc-epmanager"]').setAttribute(
        "epoptions",
        JSON.parse(
          `${destination.fslElementplaceholder.substring(0, destination.fslElementplaceholder.length - 1)},\"${element}.js\"]`,
        )
          .map((file: string) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          })
          .join(","),
      );
      result.fslElementplaceholder.push(`${element}.js`);

      destination.detElementplaceholder[lcElementName] = source.detElementplaceholder[element];
      destination.detElementplaceholder[lcElementName].local = true;
    }
    // #endregion Elementplaceholder
    // #region Standards
    for (const element in source.detStandards) {
      const lcElementName = element.toLowerCase();

      if (source.detStandards[lcElementName] === undefined) {
        continue;
      }
      // #region Omit elements that are just path segments without any description.
      if (source.detStandards[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
      if (destination.detStandards[lcElementName]) {
        if (source.detStandards[lcElementName]) {
          source.detStandards[lcElementName].Code = destination.detStandards[lcElementName].Code;
        } else {
          source.detStandards[lcElementName] = destination.detStandards[lcElementName];
        }
      }
      destination.fileListing = `${destination.fileListing.substring(0, destination.fileListing.length - 1)},\"${element}.js\"]`;

      result.fileListing.push(`${element}.js`);

      destination.detStandards[lcElementName] = source.detStandards[element];
      destination.detStandards[lcElementName].local = true;
    }
    // #endregion Elementplaceholder
    return {
      fslFunctionalities: JSON.stringify(result.fslFunctionalities),
      fslElementplaceholder: JSON.stringify(result.fslElementplaceholder),
      fileListing: JSON.stringify(result.fileListing),
    };
  }
  /**
   *  Loads {@link Manager.items }, {@link Manager.itemsElementplaceholder} & {@link Manager.itemsStandard } up to
   *  the CodBi-Plugin's storage using its middleware prior to setting {@link Manager.synchronized } and
   *  {@link Manager.synchronizing } appropriately. */
  protected async enSync() {
    // #region Generate data to sync.
    const localNodeData = {
      detFunctionalities: this.convertNodes(this.items),
      detElementplaceholder: this.convertNodes(this.itemsElementplaceholder),
      detStandards: this.convertStandardNodes(this.itemsStandard),
    };

    const fileListings = this.enrichData(window[this.docPath], localNodeData);
    // #endregion Generate data to sync.
    const $ = getJQuery();

    this.synchronizing = true;
    // #region Sync
    await $.ajax({
      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
      type: "POST",
      headers: {
        "X-Action": "Update",
      },
      data: {
        ToWrite: JSON.stringify({
          fslFunctionalities: window.CodbiPluginData.fslFunctionalities,
          detFunctionalities: localNodeData.detFunctionalities,
          fslElementplaceholder: window.CodbiPluginData.fslElementplaceholder,
          detElementplaceholder: localNodeData.detElementplaceholder,
          detStandards: localNodeData.detStandards,
          fileListing: window.CodbiPluginData.fileListing,
        }),
      },
      success: (response) => {
        this.synchronizing = false;
        this.synchronized = true;

        this.cdr.markForCheck();
      },
      error: () => {
        this.synchronizing = false;

        this.cdr.markForCheck();

        alert(this.translocoService.translate("RP.Tabs.Header.Functions.Sync.NotAllowed"));
      },
    });
    // #endregion Sync
    // #region Imported Code Upload.
    for (const key of this.importedCodeToUpload.keys()) {
      await this.importedCodeToUpload.get(key)();

      this.importedCodeToUpload.delete(key);
    }
    // #endregion Imported Code Upload.
    // #region Code Renaming
    for (const toDelete of this.renamedElements) {
      await getJQuery().ajax({
        url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
        type: "POST",
        headers: {
          "X-Action": "Rename Code",
          "X-ActionDetail": toDelete.type,
          "X-Element": toDelete.oldPath,
          "X-NewElement": toDelete.newPath,
        },
        data: {
          ToWrite: "",
        },
        success: (response) => {
          this.synchronizing = false;
          this.synchronized = true;

          this.cdr.markForCheck();
        },
      });
    }

    this.renamedElements = [];
    // #endregion Code Renaming
    // #region Code Deletion
    for (const toDelete of this.removedElements) {
      if (!this.renamedElements.some((candidate) => candidate.oldPath === toDelete.path)) {
        await getJQuery().ajax({
          url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
          type: "POST",
          headers: {
            "X-Action": "Update Code",
            "X-ActionDetail": toDelete.type,
            "X-Element": toDelete.path,
          },
          data: {
            ToWrite: "",
          },
          success: (response) => {
            this.synchronizing = false;
            this.synchronized = true;

            this.cdr.markForCheck();
          },
        });
      }
    }

    this.removedElements = [];
    // #endregion Code Deletion
  }
  // #endregion Synchronization
  // #region API-Doc Updates
  /**
   * Updates the API documentation for the specified {@link Manager.currentlySelectedTreeNode } **toUpdate**.
   *
   * @param toUpdate The {@link TreeNode } to update in the API documentation. */
  protected updateNodeToAPIDoc() {
    this.activeTabDocRef[this.currentlySelectedTreeNodePath] = this.convertSingleNode(
      this.currentlySelectedTreeNode,
      this.activeTab,
    );
    // #region Update FSL if necessary
    if (
      this.currentlySelectedTreeNode.data.Description !== "" &&
      this.activeTabDocFSL.indexOf(`"${this.currentlySelectedTreeNodePath.toLowerCase()}.js"`) === -1
    ) {
      console.log("not double:", this.activeTabDocFSL, this.currentlySelectedTreeNodePath);
      this.activeTabDocFSL = `${this.activeTabDocFSL.substring(0, this.activeTabDocFSL.length - 1)},\"${this.currentlySelectedTreeNodePath.toLowerCase()}.js\"]`;
    }
    // #endregion Update FSL if necessary
    this.activeTabDocRef[this.currentlySelectedTreeNodePath].local = true;

    this.activeTabDocUpdater(this.activeTabDocFSL);

    this.synchronized = false;
  }
  // #endregion API-Doc Updates
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
        Description: node.data ? node.data.Description.replace(/'/g, "") : "",
        Parameter: node.data?.Parameter ? this.arrayToObject(node.data.Parameter) : [],
        globals: node.data?.globals ? this.arrayToObject(node.data.globals) : [],
        notes: node.data.Notes ? node.data.Notes : "",
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
    return result;
  }
  /**
   * Returns the topmost parent {@link TreeNode } with just the children leading to the one **toIsolate**.
   *
   * @param toIsolate The {@link TreeNode } to isolate.
   *
   * @returns The requested {@link TreeNode }. */
  protected isolateNode(toIsolate: TreeNode): TreeNode | undefined {
    const path: TreeNode[] = [];
    let currentNode: TreeNode | undefined = toIsolate;

    while (currentNode) {
      path.unshift(currentNode);
      currentNode = currentNode.parent;
    }

    if (path.length === 0) {
      return undefined;
    }

    let newRoot: TreeNode | undefined = undefined;
    let currentNewNode: TreeNode | undefined = undefined;

    for (let i = 0; i < path.length; i++) {
      const originalNode = path[i];
      const nextNodeInPath = path[i + 1];

      const newNode: TreeNode = {
        label: originalNode.label,
        key: originalNode.key,
        data: originalNode.data ? { ...originalNode.data } : undefined,
        children: nextNodeInPath ? [{} as TreeNode] : [],
        parent: undefined,
      };

      if (i === 0) {
        newRoot = newNode;
        currentNewNode = newNode;
      } else if (currentNewNode) {
        currentNewNode.children[0] = newNode;
        newNode.parent = currentNewNode;
        currentNewNode = newNode;
      }
    }

    if (currentNewNode) {
      currentNewNode.children = path[path.length - 1].children.map((child) => child);
    }

    return newRoot;
  }
  /**
   * Exports the {@link Manager.currentlySelectedTreeNode } into a JSON file.
   *
   * @param event The {@link Event } received. */
  protected onExportNode(event: Event) {
    // #region Update the currently selected node to be the one corresponding to the clicked remove button.
    INSTANCE.tsCheck<HTMLElement>(
      event.target,
      HTMLElement,
    ).parentElement.parentElement.parentElement.parentElement.parentElement.click();
    // #endregion Update the currently selected node to be the one corresponding to the clicked remove button.
    // #region Conversion
    const toExport: {
      detFunctionalities: object;
      detElementplaceholder: object;
      detStandards: object;
      fileListing: string;
      fslFunctionalities: string;
      fslElementplaceholder: string;
    } = {
      detFunctionalities: {},
      detElementplaceholder: {},
      detStandards: {},
      fileListing: "[]",
      fslFunctionalities: "[]",
      fslElementplaceholder: "[]",
    };

    const toConvert = ZOD.tsCheck<TreeNode>(this.currentlySelectedTreeNode, Manager.zshTeeNode);
    const parentBase = this.getTreeNodeBase(toConvert) || undefined;

    switch (this.activeTab) {
      case "Functionality":
        toExport.detFunctionalities = this.convertNodes([toConvert], parentBase);

        for (const key in toExport.detFunctionalities) {
          toExport.detFunctionalities[key].Code = window.CodbiPluginData.detFunctionalities[key]?.Code;
        }
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detFunctionalities) {
            if (toExport.detFunctionalities[key].Description !== "") {
              fsl.push(`${key}.js`);
            }
          }

          toExport.fslFunctionalities = fsl.length === 0 ? "[]" : JSON.stringify(fsl);
        }
        // #endregion Build file-listing
        break;

      case "Elementplaceholder":
        toExport.detElementplaceholder = this.convertNodes([toConvert], parentBase);

        for (const key in toExport.detElementplaceholder) {
          toExport.detElementplaceholder[key].Code = window.CodbiPluginData.detElementplaceholder[key]?.Code;
        }
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detElementplaceholder) {
            if (toExport.detElementplaceholder[key].Description !== "") {
              fsl.push(`${key}.js`);
            }
          }

          toExport.fslElementplaceholder = fsl.length === 0 ? "[]" : JSON.stringify(fsl);
        }
        // #endregion Build file-listing
        break;

      case "Standard":
        toExport.detStandards = this.convertNodes([toConvert], parentBase);

        for (const key in toExport.detStandards) {
          toExport.detStandards[key].Code = window.CodbiPluginData.detStandards[key]?.Code;
        }
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detStandards) {
            if (toExport.detStandards[key].Description !== "") {
              fsl.push(`${key}.js`);
            }
          }

          toExport.fileListing = fsl.length === 0 ? "[]" : JSON.stringify(fsl);
        }
        // #endregion Build file-listing
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
  // #region Basics
  @ViewChild("CodBi_LocalAPIDoc_New_Panel_Close") protected CodBi_LocalAPIDoc_New_Panel_Close!: ElementRef;
  /** Stores the currently unfolded segments of the right panel's accordion. */
  protected activeAccordion: string[] = ["Description"];
  // #region Data Management
  /** Stores the {@link TreeNode }-Representation of the local API-Doc Functionalities. */
  protected items: TreeNode[] = [];
  /** Stores the {@link TreeNode }-Representation of the local API-Doc Elementplaceholder. */
  protected itemsElementplaceholder = [];
  /** Stores the {@link TreeNode }-Representation of the local API-Doc Standard Configurations. */
  protected itemsStandard = [];
  /**
   * Retrieves either {@link Manager.items }, {@link Manager.itemsElementplaceholder }, {@link Manager.itemsStandards } depending on {@link this.activeTab }.
   *
   * @returns The currently active tab's {@link TreeNode } list. */
  protected get currentItems(): TreeNode[] {
    return this.activeTab === "Functionality"
      ? this.items
      : this.activeTab === "Elementplaceholder"
        ? this.itemsElementplaceholder
        : this.itemsStandard;
  }
  /** Stores the last selected {@link TreeNode } per tab so it can be restored on tab switch. */
  protected lastSelectedNodePerTab: Record<string, TreeNode | undefined> = {};
  /** Stores the currently selected {@link TreeNode }. */
  protected _currentlySelectedTreeNode: TreeNode;
  /**
   * Gets the {@link Manager._currentlySelectedTreeNode }.
   *
   * @returns The {@link Manager._currentlySelectedTreeNode }. */
  protected get currentlySelectedTreeNode(): TreeNode {
    return this._currentlySelectedTreeNode;
  }
  /**
   * Sets the {@link Manager._currentlySelectedTreeNode } which can't be set to **NULL**.
   *
   * @params toSet The {@link Manager._currentlySelectedTreeNode } to set as the current one. */
  protected set currentlySelectedTreeNode(toSet: TreeNode) {
    if (toSet === null) {
      return;
    }

    this._currentlySelectedTreeNode = toSet;
    this.lastSelectedNodePerTab[this._activeTab] = toSet;
  }
  /**
   * Sets the local API-Documentation as a JSON-{@link String } which will be parsed, stored in
   * {@link Manager.parsedAPIDoc } and joined with the {@link window.CodbiPluginData } marking the local entries by
   * setting a **local** property to **TRUE** on them.
   * The {@link Manager.items }, {@link Manager.itemsElementplaceholder } and {@link Manager.itemsStandard } will be
   * set accordingly to the parsed data. */
  @Input("apidoc")
  protected set apidoc(toSet: string) {
    this.parsedAPIDoc = JSON.parse(toSet);
    // #region Set items
    this.items = this.toTreeNodes(this.parsedAPIDoc.detFunctionalities);
    this.itemsElementplaceholder = this.toTreeNodes(this.parsedAPIDoc.detElementplaceholder);
    this.itemsStandard = this.toTreeNodes(this.parsedAPIDoc.detStandards);
    // #endregion Set items
    // #region Merge with the CodBi's internal API Doc
    for (const key in this.parsedAPIDoc.detFunctionalities) {
      window.CodbiPluginData.detFunctionalities[key].local = true;
    }
    for (const key in this.parsedAPIDoc.detElementplaceholder) {
      window.CodbiPluginData.detElementplaceholder[key].local = true;
    }

    for (const key in this.parsedAPIDoc.detStandards) {
      window.CodbiPluginData.detStandards[key].local = true;
    }
    // #endregion Merge with the CodBi's internal API Doc
  }
  /** Stores the parsed {@link Manager.apidoc }. */
  protected parsedAPIDoc: ImportedApiDoc | undefined;
  /** Stores the Path to CodBi's internal API Doc. */
  protected _docPath: string | undefined;
  /**
   * Sets the {@link Manager._docPath }.
   *
   * @params toSet The path to CodBi's internal API DOC. */
  @Input("docpath")
  protected set docPath(toSet: string) {
    this._docPath = toSet;
  }
  /**
   * Gets the {@link Manager._docPath }.
   *
   * @returns The {@link Manager._docPath }. */
  protected get docPath(): string {
    return this._docPath;
  }
  /** Stores the currently selected  {@link TreeNode }'s {@link TreeNode.data }. */
  protected _currentNodeData: TreeNodeData | undefined;
  /**
   * Gets the {@link Management._currentNodeData }.
   *
   * @returns The {@link Management._currentNodeData }. */
  get currentlySelectedFunctionalityData(): TreeNodeData {
    return this._currentNodeData;
  }
  /**
   * Gets the {@link Manager._currentNodeData }'s **Description** property.
   *
   * @returns The {@link _currentNodeData }'s **Description**.
   */
  get description(): string {
    return this._currentNodeData ? this._currentNodeData.Description : "N/A";
  }
  /**
   * Sets the {@link Manager._currentNodeData }'s **Description**. Setting this property to **UNDEFINED** will result
   * in setting it to an empty {@link string }.
   *
   * @param toSet The {@link Manager._currentNodeData }'s **Description**. */
  set description(toSet: string) {
    if (this._currentNodeData === undefined) {
      return;
    }
    if (this._currentNodeData.Description === undefined) {
      this._currentNodeData.Description = "";
    }

    this._currentNodeData.Description = toSet;
  }
  // #endregion Data Management
  // #region Resources
  /** Stores the **URL** to resources. */
  @Input() resourceurl: string | undefined;
  // #endregion Resources
  // #region Internationalization
  /**
   * Invokes {@link i18n } with the specified **key**.
   *
   * @param key See {@link i18n }.
   *
   * @returns See {@liuk i18n }.
   */
  protected i18n(key: TMessageKey): string {
    return i18n(key);
  }
  // #endregion Internationalization
  // #region Tree View
  /** Stores an {@link ElementRef } to the left panel's **p-treeview**. */
  @ViewChild("CodBi_LocalAPIDoc_Tree", { read: ElementRef }) protected CodBi_LocalAPIDoc_Tree!: ElementRef;
  /** Stores an {@link ElementRef } to the left panel's **p-treeview**. */
  @ViewChild("CodBi_LocalAPIDoc_Tree") protected CodBi_LocalAPIDoc_Tree_Component!: Tree;
  // #region Watermark
  /** Stores the URL to the watermark to use as the {@link Manager.CodBi_LocalAPIDoc_Tree }'s CSS-Background-Image. */
  @Input() protected watermark: string = "";
  // #endregion Watermark
  /** Stores the currently selected {@link TreeNode }. */
  protected _currentNode: TreeNode;
  /**
   * Sets {@link Manager._currentNode } and {@link Manager._currentNodeData }.
   *
   * @param event The {@link TreeNodeSelectEvent }. */
  protected onNodeSelect(event: TreeNodeSelectEvent) {
    this._currentNode = event.node;
    this._currentNodeData = event.node.data;
  }
  // #region Management
  /** Stores an {@link ElementRef } to a {@link HTMLInputElement } used to rename a {@link TreeNode }. */
  @ViewChild("CodBi_LocalAPIDoc_Tree_Rename_Input") CodBi_LocalAPIDoc_Tree_Rename_Input!: ElementRef;
  // #endregion Management
  // #endregion Tree View
  /** Closes the {@link Manager.CodBi_LocalAPIDoc } panel by adding the `--closed` class to it. */
  protected onClick_CodBi_LocalAPIDoc_RightPanel_Options_ClosePanel() {
    window.CodbiPluginData.managerClosed();
  }
  /** The {@link ChangeDetectorRef } for this {@link Manager }.*/
  protected cdr: ChangeDetectorRef;
  /** The {@link TranslocoService } used by this {@link Manager }. */
  public translocoService: TranslocoService;
  // #region Initialization
  /**
   * Constructs this {@link Manager } by registering **ALT + C** as the hotkey for showing/hiding itself and
   * setting the {@link Manager.cdr } as also the {@link Manager.translocoService }.
   *
   * @param cdr               The {@link Manager.cdr }.
   * @param translocoService  The {@link Manager.translocoService }. */
  constructor(cdr: ChangeDetectorRef, translocoService: TranslocoService) {
    this.cdr = cdr;
    this.translocoService = translocoService;
    // #region Register Translation Service
    window.CodbiPluginData.retrieveManagerTranslatedResource = (id: string): string => {
      return this.translocoService.translate(id);
    };
    // #endregion Register Translation Service
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
    // #region Restore activity bar when coming out of responsive shrinked view.
    window.matchMedia("screen and (min-width: 110em)").addEventListener("change", (event) => {
      if (event.matches) {
        const activeTab = document.querySelector(`#CodBi_LocalAPIDoc p-tab[ value = "${this.activeTab}"]`);
        const boundariesCurrentTab = activeTab.getBoundingClientRect();

        document
          .querySelector("#CodBi_LocalAPIDoc .p-tablist-active-bar")
          .setAttribute(
            "style",
            `width: ${boundariesCurrentTab.width}px ; left: ${boundariesCurrentTab.x - activeTab.parentElement.getBoundingClientRect().left}px ;`,
          );
      }
    });
    // #endregion Restore activity bar when coming out of responsive shrinked view.
  }
  /** Initiates this {@link Manager } further by setting the {@link Manager.translocoService }'s active language
   *  to {@link Manager.language }. */
  ngOnInit() {
    this.translocoService.setActiveLang(this.language);
  }
  // #region Imported Code Upload
  /** Stores the uploads to perform to upload imported code. */
  protected importedCodeToUpload: Map<{ type: string; key: string }, () => Promise<void>> = new Map<
    { type: string; key: string },
    () => Promise<void>
  >();
  // #endregion Imported Code Upload
  /**
   * Initializes the view further by setting the watermark, registering the close dialog and the import
   * file selection handler. */
  ngAfterViewInit() {
    getJQuery().ajax({
      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
      type: "GET",
      headers: {
        "X-Action": "Sync Allowed",
      },
      success: (response) => {
        this.syncAllowed = response.message !== "FALSE";
      },
      error: () => {
        this.syncAllowed = false;
      },
    });
    // #region Apply Watermark
    this.CodBi_LocalAPIDoc_Tree.nativeElement.style.backgroundImage = `url('${this.watermark}')`;
    // #endregion Apply Watermark
    // #region Preselect first node, if available.
    if (this.items && this.items.length > 0) {
      this.currentlySelectedTreeNode = this.items[0];
      this._currentNodeData = this.currentlySelectedTreeNode.data;
    }
    // #endregion Preselect first node, if available.
    // #region Register close dialog handler.
    this.CodBi_LocalAPIDoc_New_Panel_Close.nativeElement.addEventListener("click", (event) => {
      this.CodBi_LocalAPIDoc_New.nativeElement.style.display = "none";
      (this.CodBi_LocalAPIDoc.nativeElement as HTMLElement).classList.remove("-submerged");
    });
    // #endregion Register close dialog handler.
    // #region Register file to import selected handler.
    this.CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue.nativeElement.addEventListener("change", (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      this.synchronizing = true;

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const fileContent = e.target?.result as string;
            const parsedData: APIDocJSON = JSON.parse(fileContent);
            // #region Rename items that're already existent.
            const functionalityKeysAlreadyExistent = new Array<string>();
            const importSuffix = this.translocoService.translate("RP.Tabs.Header.Functions.Import.Elementsuffix");

            for (const candidate of Object.keys(parsedData.detFunctionalities)) {
              if (
                parsedData.detFunctionalities[candidate].Description === "" ||
                window.CodbiPluginData.detFunctionalities[candidate]
              ) {
                if (parsedData.detFunctionalities[candidate].Description !== "") {
                  let renamedFuncKey = `${candidate}${importSuffix}`;
                  let importCounter = 1;
                  while (window.CodbiPluginData.detFunctionalities[renamedFuncKey]) {
                    renamedFuncKey = `${candidate}${importSuffix}_${importCounter++}`;
                  }
                  parsedData.detFunctionalities[renamedFuncKey] = parsedData.detFunctionalities[candidate];
                  parsedData.fslFunctionalities = parsedData.fslFunctionalities.replace(
                    `${candidate}.js`,
                    `${renamedFuncKey}.js`,
                  );
                  if (parsedData.detFunctionalities[renamedFuncKey]?.Code) {
                    const escapedCandidate = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    parsedData.detFunctionalities[renamedFuncKey].Code = parsedData.detFunctionalities[
                      renamedFuncKey
                    ].Code.replace(new RegExp(`"${escapedCandidate}"`, "gi"), `"${renamedFuncKey}"`).replace(
                      new RegExp(`'${escapedCandidate}'`, "gi"),
                      `'${renamedFuncKey}'`,
                    );
                  }
                }

                delete parsedData.detFunctionalities[candidate];

                functionalityKeysAlreadyExistent.push(candidate);
              }
            }

            const standardsKeysAlreadyExistent = new Array<string>();

            for (const candidate of Object.keys(parsedData.detStandards)) {
              if (
                parsedData.detStandards[candidate].Description === "" ||
                window.CodbiPluginData.detStandards[candidate]
              ) {
                if (parsedData.detStandards[candidate].Description !== "") {
                  let renamedStdKey = `${candidate}${importSuffix}`;
                  let importCounter = 1;
                  while (window.CodbiPluginData.detStandards[renamedStdKey]) {
                    renamedStdKey = `${candidate}${importSuffix}_${importCounter++}`;
                  }
                  parsedData.detStandards[renamedStdKey] = parsedData.detStandards[candidate];

                  parsedData.fileListing = parsedData.fileListing.replace(`${candidate}.js`, `${renamedStdKey}.js`);
                  if (parsedData.detStandards[renamedStdKey]?.Code) {
                    const escapedCandidate = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    parsedData.detStandards[renamedStdKey].Code = parsedData.detStandards[renamedStdKey].Code.replace(
                      new RegExp(`"${escapedCandidate}"`, "gi"),
                      `"${renamedStdKey}"`,
                    ).replace(new RegExp(`'${escapedCandidate}'`, "gi"), `'${renamedStdKey}'`);
                  }
                }

                delete parsedData.detStandards[candidate];

                standardsKeysAlreadyExistent.push(candidate);
              }
            }

            const epKeysAlreadyExistent = new Array<string>();

            for (const candidate of Object.keys(parsedData.detElementplaceholder)) {
              if (
                parsedData.detElementplaceholder[candidate].Description === "" ||
                window.CodbiPluginData.detElementplaceholder[candidate]
              ) {
                if (parsedData.detElementplaceholder[candidate].Description !== "") {
                  let renamedEpKey = `${candidate}${importSuffix}`;
                  let importCounter = 1;
                  while (window.CodbiPluginData.detElementplaceholder[renamedEpKey]) {
                    renamedEpKey = `${candidate}${importSuffix}_${importCounter++}`;
                  }
                  parsedData.detElementplaceholder[renamedEpKey] = parsedData.detElementplaceholder[candidate];

                  parsedData.fslElementplaceholder = parsedData.fslElementplaceholder.replace(
                    `${candidate}.js`,
                    `${renamedEpKey}.js`,
                  );
                  if (parsedData.detElementplaceholder[renamedEpKey]?.Code) {
                    const escapedCandidate = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    parsedData.detElementplaceholder[renamedEpKey].Code = parsedData.detElementplaceholder[
                      renamedEpKey
                    ].Code.replace(new RegExp(`"${escapedCandidate}"`, "gi"), `"${renamedEpKey}"`).replace(
                      new RegExp(`'${escapedCandidate}'`, "gi"),
                      `'${renamedEpKey}'`,
                    );
                  }
                }

                delete parsedData.detElementplaceholder[candidate];

                epKeysAlreadyExistent.push(candidate);
              }
            }
            // #endregion Rename items that're already existent.
            // #region Upload Code
            for (const key in parsedData.detFunctionalities) {
              if (window.CodbiPluginData.detFunctionalities[key]) {
                continue;
              }

              if (parsedData.detFunctionalities[key].Code) {
                this.importedCodeToUpload.set({ type: "Functionality", key: key }, () => {
                  return new Promise<void>((resolve, reject) => {
                    getJQuery().ajax({
                      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
                      type: "POST",
                      headers: {
                        "X-Action": "Update Code",
                        "X-ActionDetail": "Functionality",
                        "X-Element": key,
                      },
                      data: {
                        ToWrite: parsedData.detFunctionalities[key].Code,
                      },
                      success: (response) => {
                        if (window.CodbiPluginData.detFunctionalities[key]) {
                          window.CodbiPluginData.detFunctionalities[key].Code = parsedData.detFunctionalities[key].Code;
                        }

                        this.cdr.markForCheck();
                        resolve();
                      },
                    });
                  });
                });
              }
            }

            for (const key in parsedData.detElementplaceholder) {
              if (parsedData.detElementplaceholder[key].Code) {
                this.importedCodeToUpload.set({ type: "Elementplaceholder", key: key }, () => {
                  return new Promise<void>((resolve, reject) => {
                    getJQuery().ajax({
                      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
                      type: "POST",
                      headers: {
                        "X-Action": "Update Code",
                        "X-ActionDetail": "Elementplaceholder",
                        "X-Element": key,
                      },
                      data: {
                        ToWrite: parsedData.detElementplaceholder[key].Code,
                      },
                      success: (response) => {
                        if (window.CodbiPluginData.detElementplaceholder[key]) {
                          window.CodbiPluginData.detElementplaceholder[key].Code =
                            parsedData.detElementplaceholder[key].Code;
                        }

                        this.cdr.markForCheck();
                        resolve();
                      },
                    });
                  });
                });
              }
            }

            for (const key in parsedData.detStandards) {
              if (parsedData.detStandards[key].Code) {
                this.importedCodeToUpload.set({ type: "Standard", key: key }, () => {
                  return new Promise<void>((resolve, reject) => {
                    getJQuery().ajax({
                      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
                      type: "POST",
                      headers: {
                        "X-Action": "Update Code",
                        "X-ActionDetail": "Standard",
                        "X-Element": key,
                      },
                      data: {
                        ToWrite: parsedData.detStandards[key].Code,
                      },
                      success: (response) => {
                        if (window.CodbiPluginData.detStandards[key]) {
                          window.CodbiPluginData.detStandards[key].Code = parsedData.detStandards[key].Code;
                        }

                        this.cdr.markForCheck();

                        resolve();
                      },
                    });
                  });
                });
              }
            }
            // #endregion Upload Code
            // #region Cancel pending deletions for re-imported elements.
            this.removedElements = this.removedElements.filter((removed) => {
              if (removed.type === "Functionality" && parsedData.detFunctionalities[removed.path]) {
                return false;
              }
              if (removed.type === "Elementplaceholder" && parsedData.detElementplaceholder?.[removed.path]) {
                return false;
              }
              if (removed.type === "Standard" && parsedData.detStandards?.[removed.path]) {
                return false;
              }
              return true;
            });
            // #endregion Cancel pending deletions for re-imported elements.
            // #region Snapshot pre-existing node paths.
            const collectNodePaths = (nodes: TreeNode[], prefix: string = ""): Set<string> => {
              const paths = new Set<string>();

              for (const node of nodes) {
                const fullPath = prefix ? `${prefix}.${node.label}` : node.label;

                paths.add(fullPath);

                if (node.children) {
                  for (const childPath of collectNodePaths(node.children, fullPath)) {
                    paths.add(childPath);
                  }
                }
              }

              return paths;
            };

            const preExistingFunctionalities = collectNodePaths(this.items);
            const preExistingEPs = collectNodePaths(this.itemsElementplaceholder);
            const preExistingStandards = collectNodePaths(this.itemsStandard);
            // #endregion Snapshot pre-existing node paths.
            const convertedData = this.mergeDataIntoStructuredTree(parsedData, {
              detElementplaceholder: this.itemsElementplaceholder,
              detFunctionalities: this.items,
              detStandards: this.itemsStandard,
            });

            this.linkParentsOfNodes(convertedData.detElementplaceholder);
            this.linkParentsOfNodes(convertedData.detFunctionalities);
            this.linkParentsOfNodes(convertedData.detStandards);
            this.generateTreeKeysOfNodes(convertedData.detElementplaceholder);
            this.generateTreeKeysOfNodes(convertedData.detFunctionalities);
            this.generateTreeKeysOfNodes(convertedData.detStandards);
            // #region Mark imported nodes and auto-expand their parents.
            const markAndExpandImported = (
              dataSection: { [key: string]: InputDataItem } | undefined,
              treeArray: TreeNode[] | undefined,
              preExisting: Set<string>,
            ) => {
              if (!dataSection || !treeArray) {
                return;
              }

              for (const key of Object.keys(dataSection)) {
                if (preExisting.has(key)) {
                  continue;
                }

                const node = this.findNodeInTree(treeArray, key.split("."));

                if (node) {
                  if (!node.data) {
                    node.data = { Description: "" } as TreeNodeData;
                  }

                  node.data.Imported = true;

                  if (node.parent) {
                    this.setStateToTopmost(true, node.parent);
                  }
                }
              }
            };

            markAndExpandImported(
              parsedData.detFunctionalities,
              convertedData.detFunctionalities,
              preExistingFunctionalities,
            );
            markAndExpandImported(
              parsedData.detElementplaceholder,
              convertedData.detElementplaceholder,
              preExistingEPs,
            );
            markAndExpandImported(parsedData.detStandards, convertedData.detStandards, preExistingStandards);
            // #endregion Mark imported nodes and auto-expand their parents.
            // #region Auto-switch to the tab containing the first imported node.
            if (parsedData.detFunctionalities && Object.keys(parsedData.detFunctionalities).length > 0) {
              this._activeTab = "Functionality";
            } else if (parsedData.detElementplaceholder && Object.keys(parsedData.detElementplaceholder).length > 0) {
              this._activeTab = "Elementplaceholder";
            } else if (parsedData.detStandards && Object.keys(parsedData.detStandards).length > 0) {
              this._activeTab = "Standard";
            }
            // #endregion Auto-switch to the tab containing the first imported node.
            // #region Remove not imported elements from filelistings.
            for (const toRemove of functionalityKeysAlreadyExistent) {
              convertedData.fslFunctionalities = convertedData.fslFunctionalities.filter(
                (candidate) => candidate !== `${toRemove}.js`,
              );
            }

            for (const toRemove of epKeysAlreadyExistent) {
              convertedData.fslElementplaceholder = convertedData.fslElementplaceholder.filter(
                (candidate) => candidate !== `${toRemove}.js`,
              );
            }

            for (const toRemove of standardsKeysAlreadyExistent) {
              convertedData.fileListing = convertedData.fileListing.filter(
                (candidate) => candidate !== `${toRemove}.js`,
              );
            }
            // #endregion Remove not imported elements from filelistings.
            this.itemsStandard = convertedData.detStandards;
            this.items = convertedData.detFunctionalities;
            this.itemsElementplaceholder = convertedData.detElementplaceholder;
            // #region Merge filelistings
            window.CodbiPluginData.fileListing = JSON.stringify([
              ...new Set([
                ...(JSON.parse(window.CodbiPluginData.fileListing) as string[]),
                ...convertedData.fileListing,
              ]),
            ]);

            window.CodbiPluginData.fslElementplaceholder = JSON.stringify([
              ...new Set([
                ...(JSON.parse(window.CodbiPluginData.fslElementplaceholder) as string[]),
                ...convertedData.fslElementplaceholder,
              ]),
            ]);
            window.CodbiPluginData.fslFunctionalities = JSON.stringify([
              ...new Set([
                ...(JSON.parse(window.CodbiPluginData.fslFunctionalities) as string[]),
                ...convertedData.fslFunctionalities,
              ]),
            ]);
            // #endregion Merge filelistings
            // #region Merge API-Doc entries.
            for (const key in parsedData.detFunctionalities) {
              if (window.CodbiPluginData.detFunctionalities[key] === undefined) {
                window.CodbiPluginData.detFunctionalities[key] = {
                  Description: parsedData.detFunctionalities[key].Description,
                  Parameter: parsedData.detFunctionalities[key].Parameter as { [name: string]: string },
                  Code: parsedData.detFunctionalities[key].Code,
                  local: true,
                };
              }
            }

            for (const key in parsedData.detElementplaceholder) {
              if (window.CodbiPluginData.detElementplaceholder[key] === undefined) {
                window.CodbiPluginData.detElementplaceholder[key] = {
                  Description: parsedData.detElementplaceholder[key].Description,
                  Parameter: parsedData.detElementplaceholder[key].Parameter as { [name: string]: string },
                  Code: parsedData.detElementplaceholder[key].Code,
                  local: true,
                };
              }
            }

            for (const key in parsedData.detStandards) {
              if (window.CodbiPluginData.detStandards[key] === undefined) {
                window.CodbiPluginData.detStandards[key] = {
                  Description: parsedData.detStandards[key].Description,
                  classes: parsedData.detStandards[key].classes as { [name: string]: string },
                  globals: parsedData.detStandards[key].globals as { [name: string]: string },
                  Code: parsedData.detStandards[key].Code,
                  Active: false,
                  local: true,
                };
              }
            }
            // #region Merge API-Doc entries.
            // #region Update interface.
            window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities);
            window.CodbiPluginData.updateEPManager(window.CodbiPluginData.fslElementplaceholder);
            window.CodbiPluginData.populateStandards();
            // #endregion Update interface.
            const activeItems = this.activeTabItems;

            if (activeItems.length !== 0) {
              this.currentlySelectedTreeNode = activeItems[0];
              this._currentNodeData = this.currentlySelectedTreeNode.data;
            }

            this.synchronizing = false;
            this.synchronized = false;

            this.cdr.markForCheck();
          } catch (error) {
            console.error("Error parsing JSON file:", error);
          }
        };

        reader.readAsText(file);
      }

      // Reset so re-selecting the same file triggers "change" again.
      (event.target as HTMLInputElement).value = "";
    });
    // #endregion Register file to import selected handler.
    // #region Restore main panel sizes.
    const storedPanelSizes = localStorage.getItem("CodBi_LocalAPIDocManager_Splitter_PanelSizes");

    if (storedPanelSizes !== "undefined" && storedPanelSizes !== undefined && storedPanelSizes !== null) {
      this.Splitter.panelSizes = INSTANCE.tsCheck<Array<number>>(JSON.parse(storedPanelSizes), Array<number>);
    }
    // #endregion Restore main panel sizes.
  }
  // #endregion Initialization
  // #endregion Basics
  // #region Right Panel
  // #region Options
  /** Stores an {@link ElementRef } to the Dialogue to create a new CodBi local API Doc entry. */
  @ViewChild("CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue")
  CodBi_LocalAPIDoc_RightPanel_Options_Import_Dialogue!: ElementRef;
  // #endregion Options
  // #region Tabs
  /** Stores the name of the currently active tab. */
  _activeTab: "Functionality" | "Elementplaceholder" | "Standard" = "Functionality";
  /**
   * Gets the name of the currently active tab.
   *
   * @returns The name of the currently active tab. */
  get activeTab(): "Functionality" | "Elementplaceholder" | "Standard" {
    return this._activeTab;
  }
  /**
   * Gets the {@link TreeNode }s of the currently active tab.
   *
   * @returns The requested {@link TreeNode }s. */
  protected get activeTabItems(): TreeNode[] {
    return this.activeTab === "Functionality"
      ? this.items
      : this.activeTab === "Elementplaceholder"
        ? this.itemsElementplaceholder
        : this.itemsStandard;
  }
  /**
   * Sets the currently selected tab.
   *
   * @param toSet The tab to set as currently active. */
  set activeTab(toSet: "Functionality" | "Elementplaceholder" | "Standard") {
    if (this._activeTab !== toSet) {
      this._activeTab = toSet;

      const remembered = this.lastSelectedNodePerTab[toSet];

      switch (this.activeTab) {
        case "Functionality":
          if (this.items.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = remembered ?? this.items[0];

          break;
        case "Elementplaceholder":
          if (this.itemsElementplaceholder.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = remembered ?? this.itemsElementplaceholder[0];
          break;
        case "Standard":
          if (this.itemsStandard.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = remembered ?? this.itemsStandard[0];

          break;
      }

      this._currentNodeData = this.currentlySelectedTreeNode.data;
    }
  }
  // #endregion Tabs
  // #region Description, Parameter, Classes, Globals & Notes
  // #region Notes
  /**
   * Makes the {@link HTMLTextAreaElement } resize automatically on input.
   *
   * @param event The {@link Event } received. */
  protected onInputNotes(event: Event) {
    const textarea = INSTANCE.tsCheck<HTMLTextAreaElement>(event.target, HTMLTextAreaElement);

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
  // #endregion Notes
  // #region Description
  /** Stores an {@link ElementRef } to the description {@link TinyMCE } fpr functionalities. */
  @ViewChild("CodBi_LocalAPIDoc_Functionalities_Description")
  CodBi_LocalAPIDoc_Functionalities_Description!: ElementRef;
  // #endregion Description
  /**
   * Handles the click on the button to add a {@link Manager.CommonApiParameter }
   * to the {@link currentlySelectedTreeNode }. This is used for adding parameter, classes and global variables.
   *
   * @param toAdd States whether a new parameter, class or global variable shall be added. */
  onClick_CodBi_LocalAPIDoc_RightPanel_AddParameter(toAdd: string) {
    if (this.currentlySelectedFunctionalityData === undefined) {
      return;
    }

    const finalToAdd = toAdd === undefined || toAdd === "parameter" ? "Parameter" : toAdd.toLowerCase();

    this.currentlySelectedTreeNode.data[finalToAdd].push(
      new CommonApiParameter(
        this.translocoService.translate("Input.Parameter.phName"),
        this.translocoService.translate("Input.Parameter.phDescription"),
      ),
    );

    this.synchronized = false;
  }
  /** Stores the actual data for restoring it on {@link onRowEditCancel }. */
  bufferParameter: Map<number, ApiParameter> = new Map<number, ApiParameter>();
  /**
   * Initiates the editing of a row by buffering the current row's value in {@link bufferParameter }.
   *
   * @param toEdit The current row's value. */
  onRowEditInit(toEdit: ApiParameter) {
    this.bufferParameter[toEdit.id] = new CommonApiParameter(toEdit.Name, toEdit.Description, toEdit.id);
  }
  /** States whether the parameter/class/global variable - name, that is currently being edited, is a valid one or not.*/
  protected currentNameValid = false;
  /** States whether the parameter/class/global variable - description, that is currently being edited, is a valid one or not.*/
  protected currentDescriptionValid = false;
  /**
   * Handles the setting of {@link Manager.currentNameValid }.
   *
   * @param event The {@link KeyboardEvent } received. */
  protected onKeyup_InputParametername(event: KeyboardEvent) {
    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    this.currentNameValid = (
      this.activeTab === "Elementplaceholder"
        ? /^([a-zA-Z0-9_$][a-zA-Z0-9_\-\,$]*\.)*[a-zA-Z0-9_$][a-zA-Z0-9\-\,_$]*(\.)?$/
        : REGEX.stdExp.property
    ).test(inputControl.value);
    // #region Check for already taken names
    if (this.currentNameValid) {
      let counter = 0;
      for (const name of this.currentlySelectedTreeNode.data[
        this.activeTab === "Functionality" || this.activeTab === "Elementplaceholder"
          ? "Parameter"
          : inputControl.getAttribute("typeToAdd").toLowerCase()
      ]) {
        if (name.Name === inputControl.value) {
          counter++;
        }

        if (counter === 2) {
          this.currentNameValid = false;

          break;
        }
      }
    }
    // #endregion Check for already taken names
  }
  /**
   * Handles the setting of {@link Manager.currentDescriptionValid }.
   *
   * @param event The {@link KeyboardEvent } received. */
  protected onKeyup_InputParameterdescription(event: KeyboardEvent) {
    const value = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement).value;

    this.currentDescriptionValid = value.length > 0 && value.length < 500;
  }
  /**
   * Handles the click on the Parameter's save row button.
   *
   * @param toSave          The actual data to save.
   * @param index           The index of the edited row as passed by angular.
   * @param typeOfDataToAdd The type of data to add, which is either "Classes", "Globals", "Parameter" or undefined (that will be treated the same as "Parameter"). */
  onRowEditSave(toSave: ApiParameter, index: number, typeOfDataToAdd: "Classes" | "Globals" | "Parameter" | undefined) {
    (typeOfDataToAdd === undefined || typeOfDataToAdd === "Parameter"
      ? this.currentlySelectedFunctionalityData.Parameter
      : typeOfDataToAdd.toLowerCase() === "classes"
        ? this.currentlySelectedFunctionalityData.classes
        : this.currentlySelectedFunctionalityData.globals)[index] = toSave;

    this.updateNodeToAPIDoc();

    this.synchronized = false;
  }
  /**
   * Restores the current row's value from {@link Manager.bufferParameter } Prior to reassigning
   * the {@link Manager._currentNodeData } in order to update the view.
   *
   * @param parameter The current row's value, which won't be used.
   * @param index     The current row's index. */
  onRowEditCancel(
    parameter: ApiParameter,
    index: number,
    typeOfDataToAdd: "Classes" | "Globals" | "Parameter" | undefined,
  ) {
    (typeOfDataToAdd === undefined || typeOfDataToAdd === "Parameter"
      ? this.currentlySelectedFunctionalityData.Parameter
      : typeOfDataToAdd.toLowerCase() === "classes"
        ? this.currentlySelectedFunctionalityData.classes
        : this.currentlySelectedFunctionalityData.globals)[index] = this.bufferParameter[parameter.id];

    this._currentNodeData = this._currentNodeData;
  }
  /**
   * Removes the current row from the {@link Manager._currentNode }'s {@link TreeNodeData.Parameter }.
   *
   * @param parameter The current row's value, that won't be used anyway. */
  onRowDelete(parameter: ApiParameter, toAdd?: string) {
    const prop = toAdd === undefined || toAdd === "Parameter" ? "Parameter" : toAdd.toLowerCase();

    this._currentNodeData[prop] = this._currentNodeData[prop].filter((candidate) => candidate.Name !== parameter.Name);

    this.updateNodeToAPIDoc();
    this._currentNodeData = this._currentNodeData;
    this.synchronized = false;
  }
  /**
   * Converts an object with keys and values into an array of objects,
   * where each object has a 'Name' property for the key and a 'Description' property for the value.
   *
   * @param toConvert The object to convert.
   * @returns An array of objects with 'Name' and 'Description' properties.
   */
  protected toDescriptiveArray(toConvert: ApiParameter[]): {
    Name: string;
    Description: string;
  }[] {
    if (this.activeTab !== "Elementplaceholder") {
      return Object.values(toConvert) as { Name: string; Description: string }[];
    }
    const result: { Name: string; Description: string }[] = [];

    for (const key in toConvert) {
      if (!/^([0-9_$][0-9_\-\,$]*\.)*[0-9_$][0-9\-\,_$]*(\.)?$/.test(toConvert[key].Name)) {
        toConvert[key].Name = key;
      }
    }

    return Object.values(toConvert) as { Name: string; Description: string }[];
  }
  // #endregion Description, Parameter, Classes, Globals & Notes
  // #endregion Right Panel
  // #region Importing
  /**
   * Turns a local API Doc segment, consisting of a **Description**, **Parameter**s and optional **globals**
   * and **classes**, into a {@link TreeNode }.
   *
   * @param label             The {@link TreeNode }'s {@link TreeNode.label }.
   * @param segmentToConvert  The data of the segment to convert.
   *
   * @returns A {@link TreeNode } reflecting the given **segmentToConvert**. */
  protected toTreeNode(
    label: string,
    segmentToConvert: { Description: string; globals: object; classes: object; Parameter: object; code: string },
  ): TreeNode {
    return {
      label: label,
      data: {
        Description: segmentToConvert.Description,
        globals: segmentToConvert.globals,
        classes: segmentToConvert.classes,
        Parameter: segmentToConvert.Parameter,
        code: segmentToConvert.code,
      },
    };
  }
  /**
   * Turns all local CodBi API-Doc elements within the given {@link object } **toConvert** into an proper
   * {@link Array } of {@link TreeNode }s.
   *
   * @param toConvert The local CodBi-API Doc elements to convert.
   *
   * @returns The requested {@link Array } oif {@link TreeNode }s representing the incoming local CodBi API-Doc
   *          elements **toConvert**. */
  protected toTreeNodes(toConvert: {
    [key: string]: {
      Description?: string;
      Parameter?: ApiParameter[];
      globals?: ApiParameter[];
      classes?: ApiParameter[];
      notes?: string;
      Code?: string;
    };
  }): TreeNode[] {
    const root: TreeNode[] = [];
    const keys = Object.keys(toConvert);

    for (const key of keys) {
      const parts = key.split(".");
      let currentLevel: TreeNode[] = root;
      let parentNode: TreeNode | undefined = undefined;
      let currentPathKey: string = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;
        const existingNode = currentLevel.find((node) => node.label === part);

        if (existingNode) {
          parentNode = existingNode;
          currentLevel = existingNode.children;
          currentPathKey = existingNode.key || "";

          if (isLeaf) {
            existingNode.data = {
              Description: toConvert[key].Description,
              Parameter: [],
              globals: [],
              classes: [],
              Notes: "",
            };

            existingNode.data.Notes = toConvert[key].notes;
            existingNode.data.code = toConvert[key].Code;

            for (const pKey in toConvert[key].Parameter) {
              DEFINED.tsCheck<Array<unknown>>(existingNode.data.Parameter).push({
                Name: pKey,
                Description: toConvert[key].Parameter[pKey],
              });
            }
            for (const gKey in toConvert[key].globals) {
              DEFINED.tsCheck<Array<unknown>>(existingNode.data.globals).push({
                Name: gKey,
                Description: toConvert[key].globals[gKey],
              });
            }
            for (const cKey in toConvert[key].classes) {
              DEFINED.tsCheck<Array<unknown>>(existingNode.data.classes).push({
                Name: cKey,
                Description: toConvert[key].classes[cKey],
              });
            }
          }
        } else {
          const newNode: TreeNode = {
            label: part,
            data: {
              Description: "",
              Parameter: [],
              globals: [],
              classes: [],
              Notes: "",
            },
            children: [],
            parent: parentNode,
          };

          const siblingIndex = currentLevel.length;

          newNode.data.Notes = toConvert[key].notes;
          newNode.data.code = toConvert[key].Code;

          if (currentPathKey === "") {
            newNode.key = siblingIndex.toString();
          } else {
            newNode.key = `${currentPathKey}-${siblingIndex}`;
          }

          currentPathKey = newNode.key;

          if (isLeaf) {
            newNode.data = {
              Description: toConvert[key].Description,
              Parameter: [],
              globals: [],
              classes: [],
              Notes: "",
            };

            newNode.data.Notes = toConvert[key].notes;
            newNode.data.code = toConvert[key].Code;

            for (const pKey in toConvert[key].Parameter) {
              DEFINED.tsCheck<Array<unknown>>(newNode.data.Parameter).push({
                Name: pKey,
                Description: toConvert[key].Parameter[pKey],
              });
            }
            for (const gKey in toConvert[key].globals) {
              DEFINED.tsCheck<Array<unknown>>(newNode.data.globals).push({
                Name: gKey,
                Description: toConvert[key].globals[gKey],
              });
            }
            for (const cKey in toConvert[key].classes) {
              DEFINED.tsCheck<Array<unknown>>(newNode.data.classes).push({
                Name: cKey,
                Description: toConvert[key].classes[cKey],
              });
            }
          }

          currentLevel.push(newNode);

          parentNode = newNode;
          currentLevel = newNode.children;
        }
      }
    }

    return root;
  }
  /**
   * Invokes {@link Manager.generateTreeKeys } for every {@link TreeNode } **toGenerateIn**.
   *
   * @param toGenerateIn The {@link TreeNode }s to invoke {@link Manager.generateTreeKeys } for.
   *
   * @returns The {@link TreeNode }s **toGenerateIn**. */
  protected generateTreeKeysOfNodes(toGenerateIn: Array<TreeNode>): Array<TreeNode> {
    function assign(node: TreeNode, currentKey: string): void {
      node.key = currentKey;

      if (node.children) {
        node.children.forEach((child, index) => {
          const childKey = `${currentKey}-${index}`;
          assign(child, childKey);
        });
      }
    }

    toGenerateIn.forEach((node, index) => {
      const rootKey = String(index);
      assign(node, rootKey);
    });

    return toGenerateIn;
  }
  /**
   * Cultivates a "key" property within the {@link TreeNode } **toGenerateIn** and it'S {@link TreeNode.children }
   * corresponding to the relative position of the node within it's surrounding ones.
   *
   * @param toGenerateIn The {@link TreeNode } to generate the "key" properties in.
   *
   * @returns The {@link TreeNode } **toGenerateIn**. */
  protected generateTreeKeys(toGenerateIn: TreeNode): TreeNode {
    function assign(node: TreeNode, currentKey: string): void {
      node.key = currentKey;

      if (node.children) {
        node.children.forEach((child, index) => {
          const childKey = `${currentKey}-${index}`;
          assign(child, childKey);
        });
      }
    }

    assign(toGenerateIn, "0");

    return toGenerateIn;
  }
  /**
   * Invokes {@link Manager.linkParents } for every {@link TreeNode } in **toLink**.
   *
   * @param toLink The {@link TreeNode }s to invoke {@link Manager.linkParents } for.
   *
   * @returns The {@link TreeNode }s **toLink**.
   */
  protected linkParentsOfNodes(toLink: Array<TreeNode>): Array<TreeNode> {
    for (const node of toLink) {
      this.linkParents(node);
    }

    return toLink;
  }
  /**
   * Generates a "parent" property in each the {@link TreeNode } **toGenerateIn** and each of it's
   * {@link TreeNode.children } that way linking them to each other.
   *
   * @param toLink The {@link TreeNode } to link to it's {@link TreeNode.children }. */
  protected linkParents(toLink: TreeNode): TreeNode {
    for (const child of toLink.children) {
      child.parent = toLink;

      this.linkParents(child);
    }

    return toLink;
  }
  /**
   * Imports incoming {@link APIDocJSON } data into already existent {@link APIDoc_MergeableTreeNode } one.
   *
   * @param incomingData      The imported {@link APIDocJSON } to merge.
   * @param initialTreeObject The {@link APIDoc_MergeableTreeNode } data to import the **incomingData** into.
   *
   * @returns The resulting {@link APIDoc_MergeableTreeNode } data. */
  protected mergeDataIntoStructuredTree(
    incomingData: APIDocJSON,
    initialTreeObject: APIDoc_MergeableTreeNode = {},
  ): APIDoc_MergeableTreeNode {
    const mergedTree: APIDoc_MergeableTreeNode = { ...initialTreeObject };
    /**
     * Finds or creates a hierarchical path of {@link TreeNode }s within a given array of nodes.
     *
     * This function traverses the **nodes** array (and its children) based on the
     * dot-separated **fullLabel**. If a node in the path does not exist, it will be
     * created and added to the appropriate **children** array.
     *
     * @param nodes     The array of {@link TreeNode }s to search within or add to. This {@link Array }
     *                  (and its nested children arrays) will be modified in place if
     *                  new nodes need to be created.
     * @param fullLabel A dot-separated {@link string } representing the hierarchical path
     *                  to the target node (e.g., "Root.Child.Grandchild").
     *
     * @returns The topmost parent {@link TreeNode} that was passed as an argument.
     *          This will be the {@link TreeNode } corresponding to the last part of the **fullLabel**. */
    const getOrCreateNode = (nodes: TreeNode[], fullLabel: string): TreeNode => {
      const parts = fullLabel.split(".");
      let currentNodes = nodes;
      let targetNode: TreeNode | undefined;

      for (let i = 0; i < parts.length; i++) {
        const labelPart = parts[i];
        let node = currentNodes.find((n) => n.label === labelPart);

        if (!node) {
          node = { label: labelPart, children: [], data: { Description: "" } as TreeNodeData };

          currentNodes.push(node);
        }

        if (i === parts.length - 1) {
          targetNode = node;
        } else {
          currentNodes = node.children;
        }
      }

      return DEFINED.tsCheck<TreeNode>(targetNode);
    };
    /**
     * Helper to process incoming collection (globals, classes, Parameter) into an {@link Array } of objects
     * on the target node's data. Each object in the {@link Array } should ideally have a **Name** property.
     * Ensures the target property is always an {@link Array } and avoids adding duplicate items.
     *
     * @param targetData          The data object of the {@link TreeNode } where the collection will be stored.
     * @param propName            The name of the property to store (e.g., 'globals').
     * @param incomingCollection  The raw incoming data for this property (can be an {@link Array }, object, etc.). */
    const processToArrayCollection = (
      targetData: { [key: string]: Array<object> },
      propName: "globals" | "classes" | "Parameter",
      incomingCollection:
        | Array<object>
        | { Name: string | undefined; Description: string | undefined }
        | { [name: string]: string }
        | SimplifiedNamedItem[]
        | undefined,
    ) => {
      if (!Array.isArray(targetData[propName])) {
        targetData[propName] = [];
      }

      const currentArray = targetData[propName];

      if (incomingCollection !== undefined && incomingCollection !== null) {
        const itemsToAdd: { Name?: string; Description?: string; [key: string]: unknown }[] = [];
        // If incoming is already an array of items (e.g., [{ Name: "foo", Description: "bar" }])
        if (Array.isArray(incomingCollection)) {
          for (const item of incomingCollection) {
            if (
              typeof item === "object" &&
              item !== null &&
              (item as { [key: string]: unknown; Name?: string; Description?: string }).Name !== undefined
            ) {
              itemsToAdd.push(item as { [key: string]: unknown; Name?: string; Description?: string });
            }
          }
        } else if (typeof incomingCollection === "object") {
          if (
            incomingCollection.Name !== undefined &&
            (incomingCollection.Description !== undefined || Object.keys(incomingCollection).length > 1)
          ) {
            itemsToAdd.push(incomingCollection);
          } else {
            for (const nameKey in incomingCollection) {
              if (Object.prototype.hasOwnProperty.call(incomingCollection, nameKey)) {
                if (incomingCollection[nameKey] !== undefined && incomingCollection[nameKey] !== null) {
                  itemsToAdd.push({ Name: nameKey, Description: String(incomingCollection[nameKey]) });
                }
              }
            }
          }
        }

        for (const newItem of itemsToAdd) {
          // #region Check if an item with the same name already exists in currentArray...
          const exists = currentArray.some(
            (existingItem: object) =>
              ZOD.tsCheck<{ Name: string }>(
                existingItem,
                z.lazy(() =>
                  z.object({
                    Name: z.string(),
                  }),
                ),
              ).Name === newItem.Name,
          );
          // #endregion Check if an item with the same name already exists in currentArray...
          if (!exists) {
            currentArray.push(newItem);
          }
        }
      }
    };
    /**
     * Processes a specific section of API documentation data and integrates it
     * into a hierarchical tree structure.
     *
     * @param sectionName Specifies the top-level key within the resulting merged tree.
     * @param dataSection The actual data object for the specified **sectionName** from
     *                    the {@link APIDocJSON} structure. */
    const processComplexSection = (
      sectionName: "detStandards" | "detFunctionalities" | "detElementplaceholder",
      dataSection: APIDocJSON["detStandards"] | APIDocJSON["detFunctionalities"] | APIDocJSON["detElementplaceholder"],
    ) => {
      if (!mergedTree[sectionName]) {
        mergedTree[sectionName] = [];
      }

      const targetArray = DEFINED.tsCheck<TreeNode[]>(mergedTree[sectionName]);

      for (const key in dataSection) {
        if (Object.prototype.hasOwnProperty.call(dataSection, key)) {
          const item = dataSection[key];
          const itemNode = getOrCreateNode(targetArray, key);

          if (item.Description !== undefined && itemNode.data?.Description === undefined) {
            if (!itemNode.data) {
              itemNode.data = { Description: item.Description };
            } else {
              itemNode.data.Description = item.Description;
            }
          }

          if (!itemNode.data) {
            itemNode.data = {
              Description: "",
            };
          } else {
            if (item.Description !== undefined) {
              itemNode.data.Description = item.Description;
            } else {
              itemNode.data.Description = "";
            }
          }

          processToArrayCollection(itemNode.data, "globals", item.globals);
          processToArrayCollection(itemNode.data, "classes", item.classes);
          processToArrayCollection(itemNode.data, "Parameter", item.Parameter);
        }
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

    // #region Parse file listing fields (handles both JSON arrays and legacy CSV strings).
    const parseFileList = (raw: string): string[] => {
      try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return parsed;
        }

        if (typeof parsed === "string") {
          raw = parsed;
        }
      } catch {
        // Not valid JSON — fall back to CSV split.
      }

      return raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    };

    if (incomingData.fileListing) {
      mergedTree.fileListing = parseFileList(incomingData.fileListing);
    }

    if (incomingData.fslElementplaceholder) {
      mergedTree.fslElementplaceholder = parseFileList(incomingData.fslElementplaceholder);
    }

    if (incomingData.fslFunctionalities) {
      mergedTree.fslFunctionalities = parseFileList(incomingData.fslFunctionalities);
    }
    // #endregion Parse file listing fields (handles both JSON arrays and legacy CSV strings).

    return mergedTree;
  }
  // #endregion Importing
  // #region Dialogues
  // #region CodBi_LocalAPIDoc_New
  protected onKeyup_CodBi_LocalAPIDoc_New(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.CodBi_LocalAPIDoc_New_Panel_Close.nativeElement.click();
    }
  }
  // #endregion CodBi_LocalAPIDoc_New
  // #endregion Dialogues
}
// #endregion Classes
/** Defines an item with a name and an optional description. */
interface ItemWithDescription {
  Name: string;
  Description?: string;
}
