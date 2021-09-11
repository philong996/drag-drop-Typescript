console.log("==== PRACTICE PROJECT ====");

// Project state class
class ProjectState {
    private projects: any[] = [];
    private static instance: ProjectState;
    private listeners: any[] = [];

    constructor() {}

    public static getInstance(): ProjectState {
        if (!this.instance) {
            this.instance = new ProjectState();
        }

        return this.instance;
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, numPeople: number) {
        const newProject = {
            id: Math.random().toString(),
            title: title,
            description: description,
            people: numPeople,
        };
        this.projects.push(newProject);

        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
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

// Project list class
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProject: any[] = [];

    constructor(private type: "active" | "finished") {
        this.templateElement = document.getElementById(
            "project-list"
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;
        // this.assignedProject = [];

        const tempContent = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = tempContent.firstElementChild! as HTMLElement;

        this.element.id = `${this.type}-projects`;

        projectState.addListener((projects: any) => {
            this.assignedProject = projects;
            this.renderProjects();
        })

        this.attach();
        this.renderContent();
        this.renderProjects();
    }

    private renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`)!;
        for (const prjItem of this.assignedProject) {
            const listItem = document.createElement("li");
            listItem.textContent = prjItem.title;
            
            listEl.appendChild(listItem);
        }

    }

    private renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;

        this.element.querySelector("h2")!.textContent =
            `${this.type} projects`.toUpperCase();
    }

    private attach() {
        this.hostElement.insertAdjacentElement("beforeend", this.element);
    }
}

// Project input class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;

    titleElement: HTMLInputElement;
    descriptionElement: HTMLInputElement;
    peopleElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById(
            "project-input"
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById("app")! as HTMLDivElement;

        const tempContent = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = tempContent.firstElementChild! as HTMLFormElement;

        this.titleElement = this.element.querySelector(
            "#title"
        ) as HTMLInputElement;
        this.descriptionElement = this.element.querySelector(
            "#description"
        ) as HTMLInputElement;
        this.peopleElement = this.element.querySelector(
            "#people"
        ) as HTMLInputElement;

        this.element.id = "user-input";

        this.attach();
        this.configure();
    }

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
            const [title,
                description,
                numPeople] = userInput;
            projectState.addProject(title, description, numPeople);

            this.clearInput();
        }
    }

    private configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }

    private attach() {
        this.hostElement.insertAdjacentElement("afterbegin", this.element);
    }
}

const projectInput = new ProjectInput();
const activeProjects = new ProjectList("active");
const finishedProjects = new ProjectList("finished");