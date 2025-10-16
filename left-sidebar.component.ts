import { DatePipe } from "@angular/common";
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, ViewChild, input } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationStart, Router } from "@angular/router";
import { ContentData, categoryModel } from "@models/SearchContent";
import { ClickService } from "@services/click.service";
import { MyklineNXTService } from "@services/crudAPIS/mykline-nxt.service";
import { SearchSyncConnectService } from "@services/search-sync-connect.service";
import { SessionOrlocalStorageService } from "src/app/services/session-orlocal-storage.service";
import { MenuService } from "ag-grid-community";
import { DxSelectBoxModule, DxTextBoxModule, DxTemplateModule, DxDropDownButtonModule, DxAccordionComponent, DxDateRangeBoxComponent, DxTreeViewComponent } from "devextreme-angular";
import { Subscription } from "rxjs";
import { SharedModule } from "src/app/shared/shared.module";
import { DaterangepickerDirective } from "ngx-daterangepicker-material";
import { NavigationStateService } from "src/app/navigation-state.service";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
interface Item {
  Id: number;
  Name: string;
  IsActive: boolean;
  ParentId: number;
  items: Item[];
}

interface TreeNode {
  Id: number;
  ParentId: number;
  Name: string;
  selected?: boolean;
  items?: TreeNode[];
}

type QueryParamFiltersModel = {
  year: string[];
  industry: string[];
  region: string[];
};
const now = new Date();
@Component({
  standalone: true,
  selector: "app-left-sidebar",
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
  providers: [Title, MyklineNXTService, MenuService, DatePipe],
  templateUrl: "./left-sidebar.component.html",
  styleUrl: "./left-sidebar.component.scss"
})
export class LeftSidebarComponent {
  navigationStarted: boolean = false;
  onDateClick() { }
  @ViewChild("dxdaterngbox", { static: false })
  rangeBox!: DxDateRangeBoxComponent;
  private filtersInitialized: boolean = false;
  showLoading: boolean = true;
  searchForm!: FormGroup;
  filterForm!: FormGroup;
  public sidebarOpened?: boolean;
  public showFilters?: boolean;
  public collapseSidebar: boolean = false;
  public condition?: boolean = false;
  @Output() filterItems = new EventEmitter();
  @Output() clearFilterEvent = new EventEmitter<boolean>(false);
  @Output() OnFilterItemMouseClicked = new EventEmitter();

  //to control popup//
  @Input() tipsOpen: boolean = false;
  @Input() feedbackOpen: boolean = false;
  @Input() RightModalOpen: boolean = false;
  @Input() ContactUsOpen: boolean = false;
  initialValue: Date[] = [new Date(), new Date()];

  currentValue: any = this.initialValue;

  treeBoxValue: string[];
  public dragEnabled: boolean = true;
  public floatingTab: boolean = true;

  @ViewChild("treeview1", { static: false }) treeView1!: DxTreeViewComponent;
  @ViewChild("treeview2", { static: false }) treeView2!: DxTreeViewComponent;
  @ViewChild("treeview3", { static: false }) treeView3!: DxTreeViewComponent;
  @ViewChild("treeview4", { static: false }) treeView4!: DxTreeViewComponent;

  @ViewChild("regionAccordion ", { static: false }) regionAccordion!: DxAccordionComponent;
  @ViewChild("baseYearAccordion", { static: false }) baseYearAccordion!: DxAccordionComponent;
  @ViewChild("industryAccordion", { static: false }) industryAccordion!: DxAccordionComponent;

  baseYearAccordionExpanded: boolean = false;
  industryAccordionExpanded: boolean = false;
  regionAccordionExpanded: boolean = false;

  baseYearAccordionInitialized: boolean = false;
  industryAccordionInitialized: boolean = false;
  regionAccordionInitialized: boolean = false;

  queryIndustryFilterDataFetched: boolean = false;
  queryRegionFilterDataFetched: boolean = false;
  queryYearFilterDataFetched: boolean = false;

  industryAccordionIndex = 0;
  baseYearAccordionIndex = 0;
  regionAccordionIndex = 0;
  eIComponent: any;
  eBComponent: any;
  eTComponent: any;
  eRComponent: any;

  selectedEmployees: any[] = [];

  public selectedFilterItem: any;
  FilterCategoryData = [];

  filterLength: any = 0;

  quickLinks: any = [];
  finallyData: any = [];
  initialFilterData: any = [];
  userData: any = JSON.parse(this.sessionOrlocalStorageService.getData("userData"));
  userID: any;
  defaultProfile: any;
  dragPosition = { x: 0, y: 0 };
  filteringData: any = {
    searchString: "",
    categoryIds: [1],
    sortby: "",
    fromDate: "2020-03-06T06:49:26.451Z",
    toDate: "2024-03-06T06:49:26.451Z",
    pageNumber: 0,
    pageSize: 0,
  };

  geographyActive: boolean = false;
  topicActive: boolean = false;
  @ViewChild(DaterangepickerDirective, { static: false })
  pickerDirective!: DaterangepickerDirective;
  industry: any[] = [];
  Region: any[] = [];
  baseYear: any[] = [];

  RegionNames: any[] = [];
  IndustryNames: any[] = [];

  industryFilterLength: number = 0;
  BaseYearFilterLength: number = 0;
  TopicsFilterLength: number = 0;
  RegionFilterLength: number = 0;
  isActiveAll: boolean = false;
  accordionInitialized: boolean = false;
  programmaticChange = false;
  selectedKeys: number[] = [];
  selectedIndustryKeys: number[] = [];
  selectedBaseYearKeys: number[] = [];
  selectedRegionKeys: number[] = [];
  @Input("queryParamFilters") queryParamFilters: QueryParamFiltersModel = {
    year: [],
    industry: [],
    region: [],
  };

  //ItemsUnselected: EventEmitter<boolean>= new EventEmitter<boolean>(false);
  ItemsUnselected: Boolean = false;
  private subscription: Subscription = new Subscription();

  private actionInProgress: boolean = false;
  selectedDate: any = undefined;
  alwaysShowCalendars: boolean = true;
  startDate: any;
  endDate: any = "";
  showFilter = false;
  yearsFromQueryParams: string[] = [];
  industryFromQueryParams: string[] = [];

  ranges: any = {
    Today: [new Date(now.setHours(0, 0, 0, 0)), new Date(now.setHours(23, 59, 59, 999))],
    Yesterday: [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 1))],
    "Last 7 Days": [new Date(new Date().setDate(new Date().getDate() - 6)), new Date()],
    "Last 30 Days": [new Date(new Date().setDate(new Date().getDate() - 29)), new Date()],
    "Last 90 Days": [new Date(new Date().setDate(new Date().getDate() - 89)), new Date()],
    "Last Month": [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)],
  };
  queryFilterDataFetched: boolean = false;

  queryParamFilter: QueryParamFiltersModel = {
    year: [],
    industry: [],
    region: [],
  };
  selectedFilters: any = {};
  isNavigatedWithinApp: boolean = false;
  constructor(private navigationStateService: NavigationStateService, private title: Title, public formBuilder: FormBuilder, private menuService: MenuService, private el: ElementRef, private renderer: Renderer2, public datePipe: DatePipe, private clickService: ClickService, private myKlineNXTService: MyklineNXTService, private SearchSync: SearchSyncConnectService, private sessionOrlocalStorageService: SessionOrlocalStorageService, private router: Router, private route: ActivatedRoute) {
    this.renderer.addClass(this.el.nativeElement, "draggable-item");
    // this.renderer.setAttribute(this.el.nativeElement, 'cdkDrag', '');
    this.treeBoxValue = ["10"];

    this.router.events.subscribe((val) => {
      if (val instanceof NavigationStart) {
        this.navigationStateService.setNavigationState(true);
      }
    });

    let storedDate = JSON.parse(localStorage.getItem("selectedDate") || "{}");
    if (storedDate.startDate && storedDate.endDate) {
      storedDate = {
        startDate: dayjs(storedDate.startDate).utc(),
        endDate: dayjs(storedDate.endDate).utc(),
      };
      this.selectedDate = storedDate;
      this.onReleaseDateSearch.emit(this.selectedDate);
    }
  }

  // New method to select all industries (ID 1624 from API response)
  selectAllIndustries(): void {
    if (this.actionInProgress) return;
    
    this.actionInProgress = true;
    
    // Find the industry with ID 1624 from the finallyData
    const industryNode = this.findNodeById(this.finallyData, 1624);
    if (industryNode) {
      industryNode.selected = true;
      this.updateFinallyData();
      this.filterlength(this.finallyData);
      this.updateComponentState();
      
      // Emit the change
      this.filterItems.emit({ 
        e: { component: { _dataAdapter: { _selectedNodesKeys: [1624] } } }, 
        type: 'I' 
      });
    }
    
    setTimeout(() => {
      this.actionInProgress = false;
    }, 300);
  }

  // Check if all industries is selected
  isAllIndustriesSelected(): boolean {
    const industryNode = this.findNodeById(this.finallyData, 1624);
    return industryNode ? industryNode.selected : false;
  }

  // Helper method to find node by ID
  findNodeById(nodes: any[], id: number): any {
    for (const node of nodes) {
      if (node.Id === id) {
        return node;
      }
      if (node.items && node.items.length > 0) {
        const found = this.findNodeById(node.items, id);
        if (found) return found;
      }
    }
    return null;
  }

  handleClickRegionAccordionClick($event: any) {
    if (this.regionAccordionExpanded) {
      this.regionAccordion.instance.collapseItem(0).then((data) => {
        this.regionAccordionExpanded = false;
      });
    } else if (!this.regionAccordionExpanded) {
      this.regionAccordion.instance.expandItem(0).then((data) => {
        this.regionAccordionExpanded = true;
      });
    }
  }

  handleClick($event: any, type: string) {
    switch (type) {
      case "I":
        if (this.industryAccordionExpanded) {
          // this.industryAccordion.instance.collapseItem(0);
          this.industryAccordionExpanded = false;
          this.industryAccordionIndex = -1;
        } else {
          // this.industryAccordion.instance.expandItem(0);
          this.industryAccordionExpanded = true;
          this.industryAccordionIndex = 0;
        }
        return;
      case "Y":
        if (this.baseYearAccordionExpanded) {
          // this.baseYearAccordion.instance.collapseItem(0);
          this.baseYearAccordionExpanded = false;
          this.baseYearAccordionIndex = -1;
        } else {
          // this.baseYearAccordion.instance.expandItem(0);
          this.baseYearAccordionExpanded = true;
          this.baseYearAccordionIndex = 0;
        }
        return;
      case "R":
        if (this.regionAccordionExpanded) {
          // this.regionAccordion.instance.collapseItem(0);
          this.regionAccordionExpanded = false;
          this.regionAccordionIndex = -1;
        } else {
          // this.regionAccordion.instance.expandItem(0);
          this.regionAccordionExpanded = true;
          this.regionAccordionIndex = 0;
        }
        return;
      default:
        break;
    }
  }

  ngAfterViewChecked(): void {
    if (this.queryParamFilters.industry.length && this.industryAccordion) {
      this.programmaticChange = true;
      this.industryAccordion.instance.expandItem(this.industryAccordionIndex).then((data) => {
        this.industryAccordionExpanded = true;
      });
      this.programmaticChange = false;
    }

    if (this.queryParamFilters.region.length && this.regionAccordion) {
      this.programmaticChange = true;
      this.regionAccordion.instance.expandItem(this.regionAccordionIndex).then((data) => {
        this.regionAccordionExpanded = true;
      });
      this.programmaticChange = false;
    }

    if (this.queryParamFilters.year.length && this.baseYearAccordion) {
      this.programmaticChange = true;
      this.baseYearAccordion.instance.expandItem(this.baseYearAccordionIndex).then((data) => {
        this.baseYearAccordionExpanded = true;
      });
      this.programmaticChange = false;
    }
    if (this.queryParamFilters.industry.length && this.treeView1) {
      this.programmaticChange = true;
      this.treeView1.instance.getNodes().forEach((node: any) => {
        if (this.queryParamFilters.industry.includes(node.itemData.Name)) {
          this.treeView1.instance.selectItem(node.key);
          this.toggleItemSelection(node.key, this.treeView1, this.selectedIndustryKeys);
        }
      });
      this.filterlength(this.finallyData);
      this.programmaticChange = false;
    }

    if (this.queryParamFilters.region.length && this.treeView4) {
      this.programmaticChange = true;
      this.treeView4.instance.getNodes().forEach((node: any) => {
        if (node.children && node.children.length) {
          node.children.forEach((child: any) => {
            if (this.queryParamFilters.region.includes(child.itemData.Name)) {
              this.treeView4.instance.selectItem(child.key);
              this.toggleItemSelection(child.key, this.treeView4, this.selectedRegionKeys);
            }
          });
        }
        // if (this.queryParamFilters.region.includes(node.itemData.Name)) {
        //   this.treeView4.instance.selectItem(node.key);
        //   this.toggleItemSelection(node.key, this.treeView4, this.selectedRegionKeys);
        // }
      });
      this.filterlength(this.finallyData);
      this.programmaticChange = false;
    }

    if (this.queryParamFilters.year.length && this.treeView2) {
      this.programmaticChange = true;
      this.treeView2.instance.getNodes().forEach((node: any) => {
        if (this.queryParamFilters.year.includes(node.itemData.Name)) {
          this.treeView2.instance.selectItem(node.key);
          this.toggleItemSelection(node.key, this.treeView2, this.selectedBaseYearKeys);
        }
      });
      this.filterlength(this.finallyData);
      this.programmaticChange = false;
    }
  }

  ngOnInit(): void {
    //Check if the user is navigating within the app to either clear the filter or retain the filter and document referrer helps
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state && navigation.extras.state["navigatedWithinApp"]) {
      this.isNavigatedWithinApp = navigation.extras.state["navigatedWithinApp"];
    }

    this.checkNavigationStateAndClearFilter();

    if (this.queryParamFilters.industry.length || this.queryParamFilters.region.length || this.queryParamFilters.year.length) {
      (document.querySelector("#left-sidebar-top") as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
   if (this.industry?.length && this.industry[0].items?.length) {
    this.industry = this.industry[0].items;  
    console.log(this.industry);
  }

  // For Region
  if (this.Region?.length && this.Region[0].items?.length) {
    this.Region = this.Region[0].items; 
    console.log(this.Region);
  }
    this.clickService.getRightNav().subscribe((data) => {
      if (!data && this.collapseSidebar) {
        //this.collSidebar(false);
      }
    });

    this.searchForm = this.formBuilder.group({
      search: ["", [Validators.required]],
    });
    this.filterForm = this.formBuilder.group({
      year: ["", [Validators.required]],
      industry: ["", [Validators.required]],
      region: ["", [Validators.required]],
      content_type: ["", [Validators.required]],
      FromDate: ["", [Validators.required]],
      ToDate: ["", [Validators.required]],
    });

    // this.title.setTitle("Product Hub");

    this.SearchSync.setResetData(false); //to make sure the condition doesn't get overriden

    this.subscribeToData();

    this.checkScreenSize();

    if (this.industry.length === 0 && this.Region.length === 0 && this.baseYear.length === 0) {
      this.getCategories();
    }
   
  }

  @HostListener("window:unload", ["$event"])
  onUnload(event: Event) {
    localStorage.removeItem("selectedDate");
  }

  checkNavigationStateAndClearFilter(): void {
    const isNavigatedWithinApp = this.navigationStateService.getNavigationState();
    //  console.log("isNavigatedWithinApp:", isNavigatedWithinApp);

    if (!isNavigatedWithinApp) {
      // console.log('Navigated from outside the app, clearing filter.');
      this.clearFilter();
    } else {
      // console.log('Navigated within the app, fetching categories.');
      this.getCategories();
    }

    // Reset the navigation state after checking
    this.navigationStateService.resetNavigationState();
  }


  selectNode(key: any) {
    this.treeView1.instance.selectItem(key);
  }

  toggleShowFilter() {
    this.showFilter = !this.showFilter;
  }

  getCategories(): void {
    // this.spinner.show();

    this.finallyData = [];

    this.industry = [];
    this.Region = [];
    this.baseYear = [];

    this.myKlineNXTService.getAllCategoriesForProducthub().subscribe((data: categoryModel[]) => {
      //if(this.finallyData.length===0){
      this.finallyData = data;
      this.finallyData = this.renameSubCategoriesToItems(this.finallyData);
      this.sessionOrlocalStorageService.setData("categoryData", this.finallyData);
      this.updateFinallyData();


      this.SearchSync.setFinallyData(this.finallyData);
      this.selectedFilterItem = JSON.parse(this.sessionOrlocalStorageService.getData("selectedFilterItem"));
      if (this.selectedFilterItem && this.selectedFilterItem.length > 0) {
        var categoryIds = this.selectedFilterItem.map((item: any) => item.Id);
        this.retainPreviouseSelectedNodes(categoryIds);
      }
      // this.restoreSelectedFilters();
    });
  }
  @Output() onReleaseDateSearch = new EventEmitter();

  isInvalidDate(date: any): boolean {
    const today = new Date(now.setHours(23, 59, 59, 999));
    return date > today;
  }
  clearDate(): void {
    this.SearchSync.setSelectedDate(null);
    this.SearchSync.setStartDate(null);
    this.SearchSync.setEndDate(null);
    this.selectedDate.startDate = null;
    this.selectedDate.endDate = null;
    this.onReleaseDateSearch.emit(this.selectedDate);
    this.pickerDirective.clear();
    this.selectedDate = null;
    localStorage.removeItem("selectedDate");
  }

  onSelectedChange(event: any) {
    if (event === null) return;
    if (event && event.startDate && event.endDate) {
      this.selectedDate = event;
      localStorage.removeItem("selectedDate");
      if (this.selectedDate.startDate !== null || this.selectedDate.endDate !== null) {
        this.SearchSync.setSelectedDate(this.selectedDate);
        this.SearchSync.setStartDate(this.selectedDate.startDate.$d);
        this.SearchSync.setEndDate(this.selectedDate.endDate.$d);
        this.onReleaseDateSearch.emit(this.selectedDate);
        this.selectedDate = {
          startDate: this.selectedDate.startDate, // Convert to UTC before saving
          endDate: this.selectedDate.endDate,
        };
        let storedDate = {
          startDate: this.selectedDate.startDate.utc().toISOString(), // Convert to UTC before saving
          endDate: this.selectedDate.endDate.utc().toISOString(),
        };
        localStorage.setItem("selectedDate", JSON.stringify(storedDate));
      }
    }
  }

  toggleItemSelection(itemId: number, dxTreeView: DxTreeViewComponent, itemKeys: number[]): void {
    // this.programmaticChange = true; // Prevent event triggering

    const index = itemKeys.indexOf(itemId);
    if (index === -1) {
      // Item is not selected, add it to selectedKeys
      itemKeys.push(itemId);
      dxTreeView.instance.option("selectedItemKeys", [...itemKeys]);
    }

    // this.programmaticChange = false; // Re-enable event handling
  }

  deselectItems(itemId: number, dxTreeView: DxTreeViewComponent) {
    if (dxTreeView.instance.getSelectedNodeKeys().length) {
      dxTreeView.instance.unselectItem(itemId);
    }
  }

  treeViewSelectionChanged(e: any, type: string): void {
    if (this.programmaticChange) return;

    if (!this.ItemsUnselected || this.isActiveAll) {
      if (this.actionInProgress) {
        return;
      }

      this.actionInProgress = true;

      setTimeout(() => {
        this.actionInProgress = false;
      }, 300);

      // Clean up any stale selections
      for (let i = 0; i < e.component._dataAdapter._dataStructure.length; i++) {
        if (e.component._dataAdapter._dataStructure[i].selected) {
          if (!e.component._dataAdapter._dataStructure[i].internalFields.selected) {
            e.component._dataAdapter._dataStructure[i].selected = false;
          }
        }
      }

      //  Get selected items from the full dataset, not just the component
      this.selectedFilterItem = this.getSelectedItems(this.finallyData);

      //  Recalculate lengths
      this.filterlength(this.finallyData);

      // Emit updated selection to parent which is ProductCatalogComponent)
      this.filterItems.emit({ e, type });

      //  Update  TreeView to force UI refresh
      switch (type) {
        case "I":
          this.SearchSync.setIComponent(e.component._dataAdapter._selectedNodesKeys);
          if (this.treeView1?.instance) {
            this.treeView1.instance.option("items", this.industry);
          }
          break;
        case "B":
          this.SearchSync.setBComponent(e.component._dataAdapter._selectedNodesKeys);
          if (this.treeView2?.instance) {
            this.treeView2.instance.option("items", this.baseYear);
          }
          break;
        case "T":
          this.SearchSync.setTComponent(e.component._dataAdapter._selectedNodesKeys);
          break;
        case "R":
          this.SearchSync.setRComponent(e.component._dataAdapter._selectedNodesKeys);
          if (this.treeView4?.instance) {
            this.treeView4.instance.option("items", this.Region);
          }
          break;
      }

      this.isActiveAll = true;

    }
  }




  renameSubCategoriesToItems(obj: any): any {
    if (obj instanceof Array) {
      return obj.map((item) => this.renameSubCategoriesToItems(item));
    } else if (obj instanceof Object) {
      const modifiedObj: any = { ...obj };

      if (modifiedObj.SubCategories) {
        modifiedObj.items = this.renameSubCategoriesToItems(modifiedObj.SubCategories);
        delete modifiedObj.SubCategories;
      }

      Object.keys(modifiedObj).forEach((key) => {
        modifiedObj[key] = this.renameSubCategoriesToItems(modifiedObj[key]);
      });

      return modifiedObj;
    }

    return obj;
  }

  myCLick() {
    this.dragEnabled = !this.dragEnabled;
    this.floatingTab = true;
    setTimeout(() => {
      this.floatingTab = false;
    }, 4000);
    this.dragPosition = { x: 0, y: 0 };
  }

  @ViewChild(DxAccordionComponent, { static: false }) accordion!: DxAccordionComponent;

  expandItem(index: number) {
    if (this.accordion) {
      this.accordion.instance.option("selectedIndex", index);
    }
  }

  selectRegionItems(index: any) {
    this.ItemsUnselected = false;
    this.geographyActive = true;
    //console.log(this.RegionNames.indexOf(index));
    this.treeView4.instance.selectItem(this.RegionNames.indexOf(index));
  }

  unselectRegionItems() {
    this.ItemsUnselected = true;
    this.geographyActive = true;
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("North America"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("Africa"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("Europe"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("Middle East"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("APAC"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("LATAM & Caribbean"));
    this.treeView4.instance.unselectItem(this.RegionNames.indexOf("Global"));
  }

  selectTopicItems(index: any) {
    this.ItemsUnselected = false;
    this.topicActive = true;
    //console.log(this.IndustryNames);

    //console.log(this.IndustryNames.indexOf(index));

    this.treeView1.instance.selectItem(this.IndustryNames.indexOf(index));
  }

  unselectTopicItems() {
    this.topicActive = true;
    this.ItemsUnselected = true;
    this.treeView1.instance.unselectItem(this.IndustryNames.indexOf("Finished Lubricants"));
    this.treeView1.instance.unselectItem(this.IndustryNames.indexOf("Lubricant Basestocks"));
    this.treeView1.instance.unselectItem(this.IndustryNames.indexOf("Additives & Other Specialities"));
    this.treeView1.instance.unselectItem(this.IndustryNames.indexOf("Other Specialty Chemicals"));
    //this.treeView1.instance.unselectItem(32);
  }
  clearFilter(): void {
    this.sessionOrlocalStorageService.setData("categoryData", this.finallyData);
    this.sessionOrlocalStorageService.setData("selectedFilterItem", []);
    this.clearSelection();
    this.unselectAllItems();
    this.clearFilterEvent.emit(false);
  }

  clearFilterHendleClick() {
    if (this.actionInProgress) {
      return;
    }
    this.sessionOrlocalStorageService.setData("categoryData", this.finallyData);
    this.sessionOrlocalStorageService.setData("selectedFilterItem", []);
    this.actionInProgress = true;
    this.clearSelection();
    this.unselectAllItems();

    this.clearFilterEvent.emit(true);

    setTimeout(() => {
      this.actionInProgress = false;
    }, 300);
    localStorage.removeItem("selectedDate");
  }

  clearSelection() {
    this.industryFilterLength = 0;
    this.BaseYearFilterLength = 0;
    this.TopicsFilterLength = 0;
    this.RegionFilterLength = 0;

    this.SearchSync.setIndustrySelected(0);
    this.SearchSync.setBaseYearSelected(0);
    this.SearchSync.setRegionYearSelected(0);
    this.SearchSync.setTopicSelected(0);
  }
  retainPreviouseSelectedNodes(nodeIds: number[]): void {
    const updateSelection = (items: TreeNode[]): void => {
      items.forEach((item) => {

        item.selected = nodeIds.includes(item.Id);

        if (item.items && item.items.length > 0) {
          updateSelection(item.items);
        }
      });
    };

    updateSelection(this.baseYear);
    updateSelection(this.industry);
    updateSelection(this.Region);
    this.filterlength(this.finallyData);

    // Trigger change detection
    this.industry = [...this.industry];
    this.baseYear = [...this.baseYear];
    this.Region = [...this.Region];
    this.finallyData = [...this.finallyData];

    // Update TreeView
    if (this.treeView1?.instance) {
      this.treeView1.instance.option("items", this.industry);
    }
    if (this.treeView4?.instance) {
      this.treeView4.instance.option("items", this.Region);
    }
    if (this.treeView2?.instance) {
      this.treeView2.instance.option("items", this.baseYear);
    }

    // Update your SearchSync service if needed
    this.SearchSync.setIndustryData(this.industry);
    this.SearchSync.setBaseYearData(this.baseYear);
    this.SearchSync.setRegionData(this.Region);
    this.updateComponentState();
  }

  updateNodeSelection(nodeParentId: number[]): void {
    const updateSelection = (items: TreeNode[]): void => {
      items.forEach((item) => {
        if ((nodeParentId.includes(item.Id) || nodeParentId.includes(item.ParentId)) && item.selected === true) {
          item.selected = false;
        }
        if (item.items && item.items.length > 0) {
          updateSelection(item.items);
        }
      });
    };
    updateSelection(this.baseYear);
    updateSelection(this.industry);
    updateSelection(this.Region);
    this.filterlength(this.finallyData);
    // Trigger change detection
    this.industry = [...this.industry];
    this.baseYear = [...this.baseYear];
    this.Region = [...this.Region];
    this.finallyData = [...this.finallyData];

    // Update TreeView
    if (this.treeView1 && this.treeView1.instance) {
      this.treeView1.instance.option("items", this.industry);
    }
    if (this.treeView4 && this.treeView4.instance) {
      this.treeView4.instance.option("items", this.Region);
    }
    if (this.treeView2 && this.treeView2.instance) {
      this.treeView2.instance.option("items", this.baseYear);
    }

    // Update your SearchSync service if needed
    this.SearchSync.setIndustryData(this.industry);
    this.SearchSync.setBaseYearData(this.baseYear);
    this.SearchSync.setRegionData(this.Region);
    this.updateComponentState();
  }

  private updateComponentState() {
    // Update any component state that depends on the selection
    // For example, you might want to recalculate selected items:
    this.selectedFilterItem = this.getSelectedItems(this.finallyData);

    // Emit changes if necessary
    this.SearchSync.setSelectedItem(this.selectedFilterItem);
  }

  private getSelectedItems(items: TreeNode[]): TreeNode[] {
    let selected: TreeNode[] = [];
    items.forEach((item) => {
      if (item.selected) {
        selected.push(item);
      }
      if (item.items && item.items.length > 0) {
        selected = selected.concat(this.getSelectedItems(item.items));
      }
    });
    return selected;
  }

  updateFinallyData() {
    if (this.finallyData) {
      const updateCategoryData = (newData: any) => {
        // Create a new object with expanded state set to true for root level
        const updatedData = { ...newData, expanded: true };

        // Function to recursively set expanded state and remove selected state
        const updateNodes = (node: any) => {
          if (node.SubCategories) {
            node.items = node.SubCategories.map((subNode: any) => {
              const updatedSubNode = { ...subNode, expanded: true };
              delete updatedSubNode.selected; // or set to false if you prefer
              updateNodes(updatedSubNode);
              return updatedSubNode;
            });
            delete node.SubCategories;
          }
        };

        updateNodes(updatedData);
        return [updatedData]; // Wrap in array to match your existing structure
      };

      this.industry = [];
      this.Region = [];
      this.baseYear = [];

      this.finallyData.forEach((item: any) => {
        switch (item.Name) {
          case "Industry":
            this.industry = updateCategoryData(item);
            this.SearchSync.setIndustryData(this.industry);
            this.IndustryNames = this.extractNames(this.industry);
            this.SearchSync.setIndustryNames(this.IndustryNames);
            break;
          case "Base Year":
            this.baseYear = updateCategoryData(item);
            // Sort items array in descending order based on 'Name'
            if (this.baseYear && this.baseYear[0] && this.baseYear[0].items) {
              this.baseYear[0].items.sort((a: any, b: any) => {
                const yearA = parseInt(a.Name);
                const yearB = parseInt(b.Name);
                return yearB - yearA; // For descending order
              });
            }
            this.SearchSync.setBaseYearData(this.baseYear);
            break;
          case "Region":
            this.Region = updateCategoryData(item);
            this.SearchSync.setRegionData(this.Region);
            this.RegionNames = this.extractNames(this.Region);
            this.SearchSync.setRegionNames(this.RegionNames);
            break;
        }
      });

      // Trigger change detection
      this.industry = [...this.industry];
      this.baseYear = [...this.baseYear];
      this.Region = [...this.Region];
      this.finallyData = [...this.finallyData];
      this.SearchSync.setFinallyData(this.finallyData);
    }
  }

  unselectAllItems() {
    const unselectNodes = (items: any[]) => {
      items.forEach((item) => {
        if (item.selected) {
          item.selected = false;
        }
        if (item.items && item.items.length > 0) {
          unselectNodes(item.items);
        }
      });
    };

    unselectNodes(this.industry);
    unselectNodes(this.baseYear);
    unselectNodes(this.Region);
    unselectNodes(this.finallyData);

    // Trigger change detection
    this.industry = [...this.industry];
    this.baseYear = [...this.baseYear];
    this.Region = [...this.Region];
    this.finallyData = [...this.finallyData];

    // Update TreeView
    if (this.treeView1 && this.treeView1.instance) {
      this.treeView1.instance.option("items", this.industry);
    }
    if (this.treeView4 && this.treeView4.instance) {
      this.treeView4.instance.option("items", this.Region);
    }
    if (this.treeView2 && this.treeView2.instance) {
      this.treeView2.instance.option("items", this.baseYear);
    }

    // Update your SearchSync service if needed
    this.SearchSync.setIndustryData(this.industry);
    this.SearchSync.setBaseYearData(this.baseYear);
    this.SearchSync.setRegionData(this.Region);

    this.filterlength(this.finallyData);
    this.updateComponentState();
  }

  extractNames(data: Item | Item[]): string[] {
    const names: string[] = [];

    function traverse(item: Item) {
      names.push(item.Name);
      if (item.items && item.items.length > 0) {
        item.items.forEach(traverse);
      }
    }

    if (Array.isArray(data)) {
      data.forEach(traverse);
    } else {
      traverse(data);
    }

    return names;
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const isLgScreen = window.matchMedia("(max-width: 992px)").matches;
    if (isLgScreen) {
      this.collapseSidebar = false;
      //this.collSidebar(false);
    } else {
      this.collapseSidebar = true;
      // this.collSidebar(true);
    }
  }

  filterlength(filterData: any) {
    this.industryFilterLength = 0;
    this.BaseYearFilterLength = 0;
    this.TopicsFilterLength = 0;
    this.RegionFilterLength = 0;

    for (const item of filterData) {
      // console.log(item);

      if (item.Name === "Industry") {
        for (const items of item.items) {
          //console.log(items);
          for (const itemss of items.items) {
            if (itemss.selected) {
              this.industryFilterLength++;
            }
          }
        }
      }

      if (item.Name === "Base Year") {
        for (const items of item.items) {
          if (items.selected) {
            this.BaseYearFilterLength++;
          }
        }
      }

      if (item.Name === "Topics") {
        for (const items of item.items) {
          //console.log(items);
          for (const itemss of items.items) {
            for (const itemsss of itemss.items) {
              if (itemsss.selected) {
                this.TopicsFilterLength++;
              }
            }
          }
        }
      }

      if (item.Name === "Region") {
        for (const items of item.items) {
          if (items.Name === "Global" && items.selected) {
            this.RegionFilterLength++;
          }
          for (const itemss of items.items) {
            if (itemss.selected) {
              this.RegionFilterLength++;
            }
          }
        }
      }
    }

    this.SearchSync.setIndustrySelected(this.industryFilterLength);
    this.SearchSync.setBaseYearSelected(this.BaseYearFilterLength);
    this.SearchSync.setRegionYearSelected(this.RegionFilterLength);
    this.SearchSync.setTopicSelected(this.TopicsFilterLength);
  }

  getLength(title: any) {
    switch (title) {
      case "Industry":
        return this.industryFilterLength;
        break;
      case "Base Year":
        return this.BaseYearFilterLength;
        break;
      case "Topics":
        return this.TopicsFilterLength;
        break;
      case "Region":
        return this.RegionFilterLength;
        break;
      default:
        return "";
    }
  }

  ItemClicked(event: any) {
    event.event.stopPropagation();
    this.OnFilterItemMouseClicked.emit();
    this.baseYearAccordionExpanded = false;
    this.accordion.instance.expandItem(0);

    if (this.programmaticChange) {
      // if (type === "I") {
      this.treeView1.instance.getSelectedNodes().forEach((node: any) => {
        // this.toggleItemSelection(node.key, this.treeView1, this.selectedIndustryKeys);
        // this.deselectItems(node.key, this.treeView1);
      });
      // }
      //  this.toggleItemSelection(node.key, this.treeView1, this.selectedIndustryKeys);
      return; // Do not trigger change event if it is programmatic
    }
  }

  subscribeToData() {
    
    this.subscription.add(
      this.SearchSync.isContactUsOpen$.subscribe((value) => {
        this.ContactUsOpen = value;
      })
    );

    this.subscription.add(
      this.SearchSync.filterFinallyData$.subscribe((value) => {
        this.finallyData = value;
      })
    );

    this.subscription.add(
      this.SearchSync.filterIndustryData$.subscribe((value) => {
        this.industry = value;
      })
    );

    this.subscription.add(
      this.SearchSync.filterBaseYearData$.subscribe((value) => {
        // if (value !== '') {
        this.baseYear = value;
        // } else {
        //   this.getCategories();
        // }
      })
    );

    this.subscription.add(
      this.SearchSync.filterRegionData$.subscribe((value) => {
        // if (value !== '') {
        this.Region = value;
        // } else {
        //   this.getCategories();
        // }
      })
    );

    this.subscription.add(
      this.SearchSync.resetData$.subscribe((value) => {
        if (value === true) {
          this.getCategories();
          this.clearFilterHendleClick();
          // this.spinner.hide()
        }
      })
    );

    this.subscription.add(
      this.SearchSync.FilterLength$.subscribe((value) => {
        if (value) {
          this.filterLength = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.IndustrySelected$.subscribe((value) => {
        if (value) {
          this.industryFilterLength = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.BaseYearSelected$.subscribe((value) => {
        if (value) {
          this.BaseYearFilterLength = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.TopicsSelected$.subscribe((value) => {
        if (value) {
          this.TopicsFilterLength = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.RegionSelected$.subscribe((value) => {
        if (value) {
          this.RegionFilterLength = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.filterIndustryNames$.subscribe((value) => {
        if (value) {
          this.IndustryNames = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.filterRegionNames$.subscribe((value) => {
        if (value) {
          this.RegionNames = value;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.eIComponent$.subscribe((value) => {
        if (value) {
          this.eIComponent = value;
        }
      })
    );
    this.subscription.add(
      this.SearchSync.eBComponent$.subscribe((value) => {
        if (value) {
          this.eBComponent = value;
        }
      })
    );
    this.subscription.add(
      this.SearchSync.eTComponent$.subscribe((value) => {
        if (value) {
          this.eTComponent = value;
        }
      })
    );
    this.subscription.add(
      this.SearchSync.eRComponent$.subscribe((value) => {
        if (value) {
          this.eRComponent = value;
        }
      })
    );

    const nodesToUnselecttemp = [
      this.RegionNames.indexOf("North America"),
      this.RegionNames.indexOf("Africa"),
      this.RegionNames.indexOf("Europe"),
      this.RegionNames.indexOf("Middle East"),
      this.RegionNames.indexOf("APAC"),
      this.RegionNames.indexOf("LATAM & Caribbean"),
      this.RegionNames.indexOf("Global"),
      this.IndustryNames.indexOf("Finished Lubricants"),
      this.IndustryNames.indexOf("Lubricant Basestocks"),
      this.IndustryNames.indexOf("Additives & Other Specialities"),
      this.IndustryNames.indexOf("Other Specialty Chemicals"),
    ];

    this.subscription.add(
      this.SearchSync.allQuickLinkSelected.subscribe((value: any) => {
        if (value) {
          //const nodesToUnselect = [
          //   'North America', 'Africa', 'Europe', 'Middle East', 'APAC', 'LATAM & Caribbean', 'Global',
          //   'Finished Lubricants', 'Lubricant Basestocks', 'Additives & Other Specialities', 'Other Specialty Chemicals'
          // ];
          const nodesToUnselect = [885, 888, 889, 1650, 1407, 1465, 1503, 1555, 1580, 1596, 1599];
          this.updateNodeSelection(nodesToUnselect);
        }
      })
    );

    this.subscription.add(
      this.SearchSync.quickLinkFilterItemSelected.subscribe((value: any) => {
        if (value === 0) {
          if (this.treeView4) {
            this.unselectRegionItems();
          }
          if (this.treeView1) {
            this.unselectTopicItems();
          }
          this.isActiveAll = true;
        } else {
          this.isActiveAll = false;
          this.topicActive = false;
          this.unselectRegionItems();
          this.selectRegionItems(value);
        }
      })
    );

    this.subscription.add(
      this.SearchSync.activeSubQuickLink$.subscribe((value: any) => {
        if (value === "geo") {
          this.geographyActive = true;
          this.topicActive = false;
        } else if (value === "topic") {
          this.geographyActive = false;
          this.topicActive = true;
        }
      })
    );

    this.subscription.add(
      this.SearchSync.quickLinkFilterItemSelected2.subscribe((value: any) => {
        if (value === 0) {
          if (this.treeView4) {
            this.unselectRegionItems();
          }
          if (this.treeView1) {
            this.unselectTopicItems();
          }
          this.isActiveAll = true;
        } else {
          this.isActiveAll = false;
          this.geographyActive = false;
          this.unselectTopicItems();
          this.selectTopicItems(value);
        }
      })
    );

    this.subscription.add(
      this.SearchSync.ReportByGeographyActive.subscribe(() => {
        this.geographyActive = true;
        this.topicActive = false;

        this.SearchSync.setSubQuickLinkActive("geo");
      })
    );

    this.subscription.add(
      this.SearchSync.ReportByTopicsActive.subscribe(() => {
        this.geographyActive = false;
        this.topicActive = true;

        this.SearchSync.setSubQuickLinkActive("topic");
      })
    );
  }
  //#region pills
  
// Updated method to get selected parent names - shows subcategory parent instead of root Industry
getSelectedParentNames(): string[] {
  if (!this.selectedFilterItem || !this.finallyData) return [];
  const parents = new Set<string>();

  for (const selectedItem of this.selectedFilterItem) {
    // Find the immediate parent of the selected item
    const parentName = this.findImmediateParentName(selectedItem);
    if (parentName && parentName !== 'Industry' && parentName !== 'Region') {
      parents.add(parentName);
    }
  }

  return Array.from(parents);
}

// Helper method to find immediate parent name (not root category)
findImmediateParentName(selectedItem: any): string | null {
  if (!selectedItem.ParentId) return null;
  
  // Search through the tree to find the parent
  const findParent = (nodes: any[]): any => {
    for (const node of nodes) {
      if (node.Id === selectedItem.ParentId) {
        return node;
      }
      if (node.items && node.items.length > 0) {
        const found = findParent(node.items);
        if (found) return found;
      }
    }
    return null;
  };

  const parent = findParent(this.finallyData);
  return parent ? parent.Name : null;
}

// helper: find an ancestor name by Id in finallyData tree
findAncestorNameById(searchId: number): string | null {
  let found: string | null = null;
  const recurse = (nodes: any[], parentName?: string) => {
    for (const n of nodes) {
      if (n.Id === searchId) {
        found = parentName || n.Name;
        return;
      }
      if (n.items && n.items.length) {
        recurse(n.items, n.Name);
        if (found) return;
      }
    }
  };
  recurse(this.finallyData || [], undefined);
  return found;
}

// remove / clear all selections under the given parent name (used by pill close)
removeFilterByParent(parentName: string): void {
  if (!parentName || !this.finallyData) return;

  const unselect = (nodes: any[], parentMatched = false) => {
    for (const n of nodes) {
      const thisMatches = parentMatched || n.Name === parentName;
      if (thisMatches && n.selected) n.selected = false;
      if (n.items && n.items.length) unselect(n.items, thisMatches);
    }
  };

  unselect(this.finallyData, false);

  // propagate changes to component data and treeviews so UI updates
  this.industry = [...this.industry];
  this.baseYear = [...this.baseYear];
  this.Region = [...this.Region];
  this.finallyData = [...this.finallyData];

  if (this.treeView1?.instance) this.treeView1.instance.option("items", this.industry);
  if (this.treeView2?.instance) this.treeView2.instance.option("items", this.baseYear);
  if (this.treeView4?.instance) this.treeView4.instance.option("items", this.Region);

  this.filterlength(this.finallyData);
  this.updateComponentState();
}

}