// #region Imports
// #region Types
// #region Angular
import type { AfterViewInit } from "@angular/core";
import type { Observable } from "rxjs";
// #endregion Angular
// #region PrimeNG
import type { TreeNodeSelectEvent } from "primeng/tree";
import type { TreeNode } from "primeng/api";
// #endregion PrimeNG
// #region TinyMCE
import type { EditorEvent } from "tinymce";
import type { Editor as TinyMCEEditor } from "tinymce";
// #endregion TinyMCE
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
import { trigger, state, style, animate, transition } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { Injectable } from "@angular/core";
// #endregion Angular
// #region PrimeNG
import { TreeModule } from "primeng/tree";
import { TabsModule } from "primeng/tabs";
import { SplitterModule } from "primeng/splitter";
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
import { z } from "zod";
// #endregion ZOD
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { ZOD } from "xdbc/src/DBC/ZOD";
// #endregion XDBC
import { SafeHtmlPipe } from "./SafeHtmlPipe";
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
  fileListing?: string[];
  /** The files containing the actual code for CodBi Elementplaceholder. */
  fslElementplaceholder?: string[];
  /** The files containing the actual code for CodBi Functionalities. */
  fslFunctionalities?: string[];
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
  fileListing?: TreeNode[];
  /** The files containing the actual code for CodBi Elementplaceholder. */
  fslElementplaceholder?: TreeNode[];
  /** The files containing the actual CodBi Functionalitie's code. */
  fslFunctionalities?: TreeNode[];
  /** Further top-level {@link TreeNode }s. */
  [key: string]: TreeNode[] | undefined;
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
  Name = "";
  /** See {@link ApiParameter.Description }. */
  Description = "";
  /** See {@link ApiParameter.id }. */
  id;
  /**
   * Creates this {@link ApiParameter } by setting it's {@link ApiParameter.Name },
   * {@link ApiParameter.Description } and a {@link Math.random } id.
   *
   * @param name        The {@link ApiParameter.Name }.
   * @param description The {@link ApiParameter.Description }.
   * @param id          The optional {@link ApiParameter.id } that will be generate {@link Math.random }ly,
   *                    if omitted. */
  constructor(name: string, description: string, id = Math.random()) {
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
        "http://localhost:8080/xima-formcycle/plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce/tinymce.min.js",
    },
  ],
  templateUrl: "./manager.html",
  styleUrl: "./manager.scss",
  encapsulation: ViewEncapsulation.None,
})
export class Manager implements AfterViewInit {
  // #region Component References
  @ViewChild("CodBi_LocalAPIDoc", { read: ElementRef }) CodBi_LocalAPIDoc!: ElementRef;
  // #endregion Component References
  // #region Node Management
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
  /**
   * References the {@link HTMLParagraphElement } stating that the name of a new element is already taken by a
   * native CodBi-Element. This is used to inform the user. */
  CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent!: ElementRef;
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
    const lowercaseInputControlValue = inputControl.value.toLowerCase();

    if (this.isNameTaken(lowercaseInputControlValue)) {
      this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "block";

      return;
    }
    // #endregion Check against CodBi Data.
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
      if (node === dataToRemove) {
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
  /**
   * Handles the event when the user confirms the deletion of a node.
   *
   * @param event The {@link Event } received. */
  protected onDeleteNode_OK(event: Event) {
    this.CodBi_LocalAPIDoc_Tree_Label_Remove_Question.nativeElement.style.display = "none";

    switch (this.activeTab) {
      case "Functionality":
        {
          const paths = this.getTreePaths([this._currentNode]);

          this.items = this.removeNodeRecursive(this.items, this._currentNode);
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${toFilterOut}.ts`) {
                return false;
              }
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);

          this.activeTabDocUpdater(this.activeTabDocFSL);
          // #endregion Remove from FSL
        }
        break;

      case "Elementplaceholder":
        {
          const paths = this.getTreePaths([this._currentNode]);

          this.itemsElementplaceholder = this.removeNodeRecursive(this.itemsElementplaceholder, this._currentNode);
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${toFilterOut}.ts`) {
                return false;
              }
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);

          this.activeTabDocUpdater(this.activeTabDocFSL);
          // #endregion Remove from FSL
        }

        break;

      case "Standard":
        {
          const paths = this.getTreePaths([this._currentNode]);

          this.itemsStandard = this.removeNodeRecursive(this.itemsStandard, this._currentNode);
          // #region Remove from FSL
          const toFilter = JSON.parse(`{ "result": ${this.activeTabDocFSL}}`);

          toFilter.result = toFilter.result.filter((e) => {
            for (const toFilterOut of paths) {
              if (e === `${toFilterOut}.ts`) {
                return false;
              }
            }

            return true;
          });

          this.activeTabDocFSL = JSON.stringify(toFilter.result);

          this.activeTabDocUpdater(this.activeTabDocFSL);
          // #endregion Remove from FSL
        }

        break;
    }

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
  // #region Renaming
  /**
   *  Provides access to the {@link HTMLParagraphElement } stating that the name chosen for renaming is already taken
   *  by a native CodBi-Element. */
  @ViewChild("CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent")
  CodBi_LocalAPIDoc_Tree_Label_Rename_Hint_AlreadyExistent!: ElementRef;
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
    if (inputControl.value !== "" && !/^[a-zA-Z0-9_$][a-zA-Z0-9_\-\,$]*$/.test(inputControl.value)) {
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
      this.currentlySelectedTreeNode.data === null
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
   * Initiates the renaming of the {@link Manager.currentlySelectedTreeNode } by toggling
   * {@link Manager.currentlySelectedTreeNodeEditing } also focusing the {@link Manager.currentlySelectedTreeNode }.
   *
   * @param event The {@link Event } received. */
  protected onRenameNode(event: Event) {
    INSTANCE.tsCheck<HTMLElement>(
      event.target,
      HTMLElement,
    ).parentElement.parentElement.parentElement.parentElement.parentElement.click();

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
   * Traverses a TreeNode array and returns all possible paths from the root to every node in the tree.
   * A path is a dot-separated string of node labels.
   *
   * @param nodes The array of TreeNodes to traverse.
   * @returns An array of strings, where each string is a full or partial path.
   */
  protected getTreePaths(nodes: TreeNode[]): string[] {
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
        findPathsRecursive(node, "");
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
      result.globals = node.data ? this.arrayToObject(node.data.globals) : [];
      result.classes = node.data ? this.arrayToObject(node.data.classes) : [];
    } else {
      result.Description = node.data ? node.data.Description : "";
      result.Parameter = node.data ? this.arrayToObject(node.data.Parameter ? node.data.Parameter : []) : [];
      result.globals = node.data ? this.arrayToObject(node.data.globals) : [];
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
    const lowercaseInputControlValue = INSTANCE.tsCheck<HTMLInputElement>(
      event.target,
      HTMLInputElement,
    ).value.toLowerCase();

    const labelInput = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    this.currentlySelectedTreeNode.label = labelInput.value;

    const currentlySelectedTreeNodePath = this.currentlySelectedTreeNodePath;
    // #region Update API Doc in memory
    // #region Remove former entry, if existent.
    delete this.activeTabDocRef[
      currentlySelectedTreeNodePath.replace(
        this.currentlySelectedTreeNode.label,
        this.currentlySelectedTreeNode.data.label,
      )
    ];
    // #endregion Remove former entry, if existent.
    this.activeTabDocRef[currentlySelectedTreeNodePath] = this.convertSingleNode(
      this.currentlySelectedTreeNode,
      this.activeTab,
    );

    let formerCurrentlySelectedTreeNodePath = `${this.currentlySelectedTreeNodePath.substring(0, this.currentlySelectedTreeNodePath.lastIndexOf("."))}.${this.currentlySelectedTreeNode.data.label}`;
    // #region Remove trailing dot in case element is a root one.
    if (formerCurrentlySelectedTreeNodePath[0] === ".") {
      formerCurrentlySelectedTreeNodePath = formerCurrentlySelectedTreeNodePath.substring(1);
    }
    // #endregion Remove trailing dot in case element is a root one.
    if (this.activeTabDocFSL.indexOf(`${formerCurrentlySelectedTreeNodePath.toLowerCase()}.`) !== -1) {
      this.activeTabDocFSL = this.activeTabDocFSL.replaceAll(
        formerCurrentlySelectedTreeNodePath.toLowerCase(),
        currentlySelectedTreeNodePath,
      );
    }
    // #endregion Update FSL if necessary
    this.activeTabDocRef[this.currentlySelectedTreeNodePath].local = true;
    // #endregion Update API Doc in memory
    // Update the View of external components
    this.activeTabDocUpdater(this.activeTabDocFSL);

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
  /**
   * Checks whether the new input of {@link Manager.CodBi_LocalAPIDoc_New_Name } is valid restoring to the
   * {@link Manager.formerInput_CodBi_LocalAPIDoc_New_Name } if not or updating the mentioned property, if so.
   *
   * @param event The {@link Event } that triggered this method. */
  protected onInput_CodBi_LocalAPIDoc_New_Name(event: Event) {
    this.CodBi_LocalAPIDoc_New_Panel_Name_Hint_AlreadyExistent.nativeElement.style.display = "none";

    const inputControl = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
    // #region Suppress invalid characters.
    if (!/^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*(\.)?$/.test(inputControl.value)) {
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
    // #region Remove entries without a description.
    const finalResult = {};

    for (const key in result) {
      if (result[key].Description !== "") {
        finalResult[key] = result[key];
      }
    }
    // #endregion Remove entries without a description.
    return finalResult;
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
      // #region Omit elements that are just path segments without any description.
      if (source.detFunctionalities[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
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

      destination.detFunctionalities[element.toLowerCase()] = source.detFunctionalities[element];
      destination.detFunctionalities[element.toLowerCase()].local = true;
    }
    // #endregion Functionalities
    // #region Elementplaceholder
    for (const element in source.detElementplaceholder) {
      // #region Omit elements that are just path segments without any description.
      if (source.detElementplaceholder[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
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
      destination.detElementplaceholder[element].local = true;
    }
    // #endregion Elementplaceholder
    // #region Standards
    for (const element in source.detStandards) {
      // #region Omit elements that are just path segments without any description.
      if (source.detStandards[element].Description === "") {
        continue;
      }
      // #endregion Omit elements that are just path segments without any description.
      destination.fileListing = `${destination.fileListing.substring(0, destination.fileListing.length - 1)},\"${element}.ts\"]`;

      result.fileListing.push(`${element}.ts`);
      destination.detStandards[element] = source.detStandards[element];
      destination.detStandards[element].local = true;
    }
    // #endregion Elementplaceholder
    return {
      fslFunctionalities: result.fslFunctionalities.join(","),
      fslElementplaceholder: result.fslElementplaceholder.join(","),
      fileListing: result.fileListing.join(","),
    };
  }
  /**
   *  Loads {@link Manager.items }, {@link Manager.itemsElementplaceholder} & {@link Manager.itemsStandard } up to
   *  the CodBi-Plugin's storage using its middleware prior to setting {@link Manager.synchronized } and
   *  {@link Manager.synchronizing } appropriately. */
  protected enSync() {
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
    $.ajax({
      url: `${this.baseurl}plugin?name=CodBi_LocalAPIDoc`,
      type: "POST",
      headers: {
        "X-Action": "Update",
      },
      data: {
        ToWrite: JSON.stringify({
          fslFunctionalities: fileListings.fslFunctionalities,
          detFunctionalities: localNodeData.detFunctionalities,
          fslElementplaceholder: fileListings.fslElementplaceholder,
          detElementplaceholder: localNodeData.detElementplaceholder,
          detStandards: localNodeData.detStandards,
          fileListing: fileListings.fileListing,
        }),
      },
      success: (response) => {
        this.synchronizing = false;
        this.synchronized = true;

        this.cdr.markForCheck();
      },
    });
    // #endregion Sync
  }
  // #endregion Synchronization

  protected importNode(toImport: { detElementplaceholder: object; detFunctionalities: object; detStandards: object }) {
    for (const key in toImport.detFunctionalities) {
    }
    for (const key in toImport.detElementplaceholder) {
    }
    for (const key in toImport.detStandards) {
    }

    this.synchronized = false;
  }
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
    if (this.activeTabDocFSL.indexOf(`"${this.currentlySelectedTreeNodePath.toLowerCase()}.ts"`) === -1) {
      this.activeTabDocFSL = `${this.activeTabDocFSL.substring(0, this.activeTabDocFSL.length - 1)},\"${this.currentlySelectedTreeNodePath.toLowerCase()}.ts\"]`;
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
        Parameter: node.data ? this.arrayToObject(node.data.Parameter ? node.data.Parameter : []) : [],
        globals: node.data ? this.arrayToObject(node.data.globals) : [],
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
  protected isolateNode(toIsolate: TreeNode): TreeNode {
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

      const newNode: TreeNode = {
        label: originalNode.label,
        key: originalNode.key,
        data: originalNode.data ? { ...originalNode.data } : undefined,
        children: [...originalNode.children],
      };

      if (i === 0) {
        newRoot = newNode;
        currentNewNode = newNode;
      } else if (currentNewNode) {
        currentNewNode.children.push(newNode);
        newNode.parent = currentNewNode;
        currentNewNode = newNode;
      }
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
        toExport.detFunctionalities = this.convertNodes([this.isolateNode(toConvert)]);
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detFunctionalities) {
            if (toExport.detFunctionalities[key].Description !== "") {
              fsl.push(`${key}.ts`);
            }
          }

          toExport.fslFunctionalities = fsl;
        }
        // #endregion Build file-listing
        break;

      case "Elementplaceholder":
        toExport.detElementplaceholder = this.convertNodes([this.isolateNode(toConvert)]);
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detElementplaceholder) {
            if (toExport.detFunctionalities[key].Description !== "") {
              fsl.push(`${key}.ts`);
            }
          }

          toExport.fslElementplaceholder = fsl;
        }
        // #endregion Build file-listing
        break;

      case "Standard":
        toExport.detStandards = this.convertNodes([this.isolateNode(toConvert)]);
        // #region Build file-listing
        {
          const fsl = new Array<string>();

          for (const key in toExport.detStandards) {
            if (toExport.detFunctionalities[key].Description !== "") {
              fsl.push(`${key}.ts`);
            }
          }

          toExport.fileListing = fsl;
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
  protected translocoService: TranslocoService;
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
  /** Initiates this {@link Manager } further by setting the {@link Manager.translocoService }'s active language
   *  to {@link Manager.language }. */
  ngOnInit() {
    this.translocoService.setActiveLang(this.language);
  }
  /**
   * Initializes the view further by setting the watermark, registering the close dialog and the import
   * file selection handler. */
  ngAfterViewInit() {
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

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const fileContent = e.target?.result as string;
            const parsedData: APIDocJSON = JSON.parse(fileContent);

            const convertedData = this.mergeDataIntoStructuredTree(parsedData, {
              detElementplaceholder: this.itemsElementplaceholder,
              detFunctionalities: this.items,
              detStandards: this.itemsStandard,
            });

            this.itemsStandard = convertedData.detStandards;
            this.items = convertedData.detFunctionalities;
            this.itemsElementplaceholder = convertedData.detElementplaceholder;

            const activeItems = this.activeTabItems;

            if (activeItems.length !== 0) {
              this.currentlySelectedTreeNode = activeItems[0];
              this._currentNodeData = this.currentlySelectedTreeNode.data;
            }

            this.cdr.markForCheck();
          } catch (error) {
            console.error("Error parsing JSON file:", error);
          }
        };

        reader.readAsText(file);
      }
    });
    // #endregion Register file to import selected handler.
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

      switch (this.activeTab) {
        case "Functionality":
          if (this.items.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = this.items[0];

          break;
        case "Elementplaceholder":
          if (this.itemsElementplaceholder.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = this.itemsElementplaceholder[0];
          break;
        case "Standard":
          if (this.itemsStandard.length === 0) {
            return;
          }

          this.currentlySelectedTreeNode = this.itemsStandard[0];

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
  onRowDelete(parameter: ApiParameter) {
    this._currentNodeData.Parameter = this._currentNodeData.Parameter.filter(
      (candidate) => candidate.Name !== parameter.Name,
    );

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
    segmentToConvert: { Description: string; globals: object; classes: object; Parameter: object },
  ): TreeNode {
    return {
      label: label,
      data: {
        Description: segmentToConvert.Description,
        globals: segmentToConvert.globals,
        classes: segmentToConvert.classes,
        Parameter: segmentToConvert.Parameter,
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
          node = { label: labelPart, children: [] };
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
          // Store Description directly on itemNode
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          if (item.Description !== undefined && (itemNode as any).Description === undefined) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (itemNode as any).Description = item.Description;
          }
          // Ensure itemNode.data exists for globals, classes, Parameter
          if (!itemNode.data) {
            itemNode.data = {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              Description: (itemNode as any).Description,
            };
          }

          processToArrayCollection(itemNode.data, "globals", item.globals);
          processToArrayCollection(itemNode.data, "classes", item.classes);
          processToArrayCollection(itemNode.data, "Parameter", item.Parameter);
        }
      }
    };

    const processSimpleSection = (
      sectionName: "docsAPI" | "fileListing" | "fslElementplaceholder" | "fslFunctionalities",
      dataSection:
        | APIDocJSON["docsAPI"]
        | APIDocJSON["fileListing"]
        | APIDocJSON["fslElementplaceholder"]
        | APIDocJSON["fslFunctionalities"],
    ) => {
      if (!mergedTree[sectionName]) {
        mergedTree[sectionName] = [];
      }

      const targetArray = DEFINED.tsCheck<TreeNode[]>(mergedTree[sectionName]);

      if (Array.isArray(dataSection)) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        dataSection.forEach((item) => {
          const itemNode = getOrCreateNode(targetArray, item);
          if (!itemNode.data) {
            itemNode.data = {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              Description: (itemNode as any).Description,
            };
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
interface ItemWithDescription {
  Name: string;
  Description?: string; // Add other properties if they exist
}
