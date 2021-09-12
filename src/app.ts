console.log("==== PRACTICE PROJECT ====");

// drag and drop feature interface
interface Dragable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

enum ProjectStatus {
    Active,
    Finished,
}

// Project class
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) {}
}

// implement state class
type Listener<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}

// Project state class
class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    constructor() {
        super();
    }

    public static getInstance(): ProjectState {
        if (!this.instance) {
            this.instance = new ProjectState();
        }

        return this.instance;
    }

    addProject(title: string, description: string, numPeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numPeople,
            ProjectStatus.Active
        );
        this.projects.push(newProject);
        console.log("PROJECT ADDED", newProject);

        this.updateListeners();
    }

    private updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
        const movedProject = this.projects.find(prj => prj.id === projectId);

        console.log("BEFORE UPDATE", movedProject);
        if (movedProject && movedProject.status !== newStatus) {
            movedProject.status = newStatus;
            console.log("AFTER UPDATE", movedProject);
            this.updateListeners();
        }
    }
}

// autobind decorator
function AutoBind(
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const modifiedMethod: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundMethod = originalMethod.bind(this);
            return boundMethod;
        },
    };
    return modifiedMethod;
}

// validate user input data
interface Vadidatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(data: Vadidatable) {
    let isValid = true;

    if (data.required === true) {
        isValid = isValid && data.value.toString().trim().length !== 0;
    }

    if (
        data.minLength != null && // it mean that it must not be null or undefined
        typeof data.value === "string"
    ) {
        isValid = isValid && data.value.trim().length > data.minLength;
    }

    if (
        data.maxLength != null && // it mean that it must not be null or undefined
        typeof data.value === "string"
    ) {
        isValid = isValid && data.value.trim().length < data.maxLength;
    }

    if (data.min != null && typeof data.value === "number") {
        isValid = isValid && data.value > data.min;
    }

    if (data.max != null && typeof data.value === "number") {
        isValid = isValid && data.value < data.max;
    }

    return isValid;
}

const projectState = ProjectState.getInstance();

// build abstract class for project list and project input
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostId: string,
        appendAtBegining: boolean,
        newEleId?: string
    ) {
        this.templateElement = document.getElementById(
            templateId
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostId)! as T;

        const tempContent = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = tempContent.firstElementChild! as U;
        if (newEleId) {
            this.element.id = newEleId;
        }

        this.attach(appendAtBegining);
    }

    private attach(startAtBegining: boolean) {
        this.hostElement.insertAdjacentElement(
            startAtBegining ? "afterbegin" : "beforeend",
            this.element
        );
    }

    abstract renderContent(): void;
    abstract configure(): void;
}

// project item in list
class ProjectItem
    extends Component<HTMLUListElement, HTMLLIElement>
    implements Dragable
{
    constructor(hostId: string, public project: Project) {
        super("single-project", hostId, false, project.id);

        this.configure();
        this.renderContent();
    }

    get numPeople() {
        if (this.project.people === 1) {
            return "1 person";
        }
        return `${this.project.people} people`;
    }

    configure() {
        this.element.addEventListener("dragstart", this.dragStartHandler);
        this.element.addEventListener("dragend", this.dragEndHandler);
    }

    @AutoBind
    dragStartHandler(event: DragEvent) {
        console.log("START: ",this.project.id);
        event.dataTransfer!.setData("text/plain", this.project.id);
        event.dataTransfer!.effectAllowed = "move";
    }

    @AutoBind
    dragEndHandler(event: DragEvent) {
        console.log("END: ", this.project.id);
    }

    renderContent() {
        this.element.querySelector("h2")!.textContent = this.project.title;
        this.element.querySelector("h3")!.textContent =
            this.numPeople + " assigned";
        this.element.querySelector("p")!.textContent = this.project.description;
    }
}

// Project list class
class ProjectList
    extends Component<HTMLDivElement, HTMLElement>
    implements DragTarget
{
    assignedProject: Project[];

    constructor(private type: "active" | "finished") {
        super("project-list", "app", false, `${type}-projects`);
        this.assignedProject = [];

        this.configure();
        this.renderContent();
    }

    @AutoBind
    dragLeaveHandler(event: DragEvent) {
        const listContainer = this.element.querySelector("ul")!;
        listContainer.classList.remove("droppable");
    }

    @AutoBind
    dragOverHandler(event: DragEvent) {
        if (
            event.dataTransfer &&
            event.dataTransfer.types[0] === "text/plain"
        ) {
            event.preventDefault();
            const listContainer = this.element.querySelector("ul")!;
            listContainer.classList.add("droppable");
        }
    }

    @AutoBind
    dropHandler(event: DragEvent) {
        const prjId = event.dataTransfer!.getData("text/plain");
        console.log("DROPHANDLER: ", prjId)
        projectState.moveProject(
            prjId,
            this.type === "active"
                ? ProjectStatus.Active
                : ProjectStatus.Finished
        );
    }

    configure() {
        this.element.addEventListener("dragover", this.dragOverHandler);
        this.element.addEventListener("dragleave", this.dragLeaveHandler);
        this.element.addEventListener("drop", this.dropHandler);

        projectState.addListener((projects: Project[]) => {
            // get the project based on project list type
            const relevantProjects = projects.filter((project) => {
                if (this.type === "active") {
                    return project.status === ProjectStatus.Active;
                }
                return project.status === ProjectStatus.Finished;
            });
            console.log(this.type, relevantProjects);
            this.assignedProject = relevantProjects;
            this.renderProjects();
        });
    }

    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;

        this.element.querySelector("h2")!.textContent =
            `${this.type} projects`.toUpperCase();
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)!;
        listEl.innerHTML = "";
        for (const prjItem of this.assignedProject) {
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
        }
    }
}

// Project input class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleElement: HTMLInputElement;
    descriptionElement: HTMLInputElement;
    peopleElement: HTMLInputElement;

    constructor() {
        super("project-input", "app", true, "user-input");

        this.titleElement = this.element.querySelector(
            "#title"
        ) as HTMLInputElement;
        this.descriptionElement = this.element.querySelector(
            "#description"
        ) as HTMLInputElement;
        this.peopleElement = this.element.querySelector(
            "#people"
        ) as HTMLInputElement;

        this.configure();
    }

    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }

    renderContent() {}

    private gatherUserInput(): [string, string, number] | void {
        const inputedTitle = this.titleElement.value;
        const inputedDescription = this.descriptionElement.value;
        const inputedPeople = this.peopleElement.value;

        const titleValidatable = {
            value: inputedTitle,
            required: true,
        };

        const descriptionValidatable = {
            value: inputedDescription,
            required: true,
            minLength: 5,
            maxLength: 255,
        };

        const peopleValidatable = {
            value: +inputedPeople,
            required: true,
            min: 0,
            max: 5,
        };

        if (
            validate(titleValidatable) &&
            validate(descriptionValidatable) &&
            validate(peopleValidatable)
        ) {
            return [inputedTitle, inputedDescription, +inputedPeople];
        } else {
            alert("Invalid Input!!! Please try again");
        }
    }

    private clearInput() {
        this.titleElement.value = "";
        this.descriptionElement.value = "";
        this.peopleElement.value = "";
    }

    @AutoBind
    private submitHandler(event: Event) {
        event.preventDefault();

        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, numPeople] = userInput;
            projectState.addProject(title, description, numPeople);

            this.clearInput();
        }
    }
}

const projectInput = new ProjectInput();
const activeProjects = new ProjectList("active");
const finishedProjects = new ProjectList("finished");
