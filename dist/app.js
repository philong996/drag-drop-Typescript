"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
console.log("==== PRACTICE PROJECT ====");
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
// Project class
class Project {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
// Project state class
class ProjectState extends State {
    constructor() {
        super();
        this.projects = [];
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new ProjectState();
        }
        return this.instance;
    }
    addProject(title, description, numPeople) {
        const newProject = new Project(Math.random().toString(), title, description, numPeople, ProjectStatus.Active);
        this.projects.push(newProject);
        console.log("PROJECT ADDED", newProject);
        this.updateListeners();
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
    moveProject(projectId, newStatus) {
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
function AutoBind(target, methodName, descriptor) {
    const originalMethod = descriptor.value;
    const modifiedMethod = {
        configurable: true,
        get() {
            const boundMethod = originalMethod.bind(this);
            return boundMethod;
        },
    };
    return modifiedMethod;
}
function validate(data) {
    let isValid = true;
    if (data.required === true) {
        isValid = isValid && data.value.toString().trim().length !== 0;
    }
    if (data.minLength != null && // it mean that it must not be null or undefined
        typeof data.value === "string") {
        isValid = isValid && data.value.trim().length > data.minLength;
    }
    if (data.maxLength != null && // it mean that it must not be null or undefined
        typeof data.value === "string") {
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
class Component {
    constructor(templateId, hostId, appendAtBegining, newEleId) {
        this.templateElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostId);
        const tempContent = document.importNode(this.templateElement.content, true);
        this.element = tempContent.firstElementChild;
        if (newEleId) {
            this.element.id = newEleId;
        }
        this.attach(appendAtBegining);
    }
    attach(startAtBegining) {
        this.hostElement.insertAdjacentElement(startAtBegining ? "afterbegin" : "beforeend", this.element);
    }
}
// project item in list
class ProjectItem extends Component {
    constructor(hostId, project) {
        super("single-project", hostId, false, project.id);
        this.project = project;
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
    dragStartHandler(event) {
        console.log("START: ", this.project.id);
        event.dataTransfer.setData("text/plain", this.project.id);
        event.dataTransfer.effectAllowed = "move";
    }
    dragEndHandler(event) {
        console.log("END: ", this.project.id);
    }
    renderContent() {
        this.element.querySelector("h2").textContent = this.project.title;
        this.element.querySelector("h3").textContent =
            this.numPeople + " assigned";
        this.element.querySelector("p").textContent = this.project.description;
    }
}
__decorate([
    AutoBind
], ProjectItem.prototype, "dragStartHandler", null);
__decorate([
    AutoBind
], ProjectItem.prototype, "dragEndHandler", null);
// Project list class
class ProjectList extends Component {
    constructor(type) {
        super("project-list", "app", false, `${type}-projects`);
        this.type = type;
        this.assignedProject = [];
        this.configure();
        this.renderContent();
    }
    dragLeaveHandler(event) {
        const listContainer = this.element.querySelector("ul");
        listContainer.classList.remove("droppable");
    }
    dragOverHandler(event) {
        if (event.dataTransfer &&
            event.dataTransfer.types[0] === "text/plain") {
            event.preventDefault();
            const listContainer = this.element.querySelector("ul");
            listContainer.classList.add("droppable");
        }
    }
    dropHandler(event) {
        const prjId = event.dataTransfer.getData("text/plain");
        console.log("DROPHANDLER: ", prjId);
        projectState.moveProject(prjId, this.type === "active"
            ? ProjectStatus.Active
            : ProjectStatus.Finished);
    }
    configure() {
        this.element.addEventListener("dragover", this.dragOverHandler);
        this.element.addEventListener("dragleave", this.dragLeaveHandler);
        this.element.addEventListener("drop", this.dropHandler);
        projectState.addListener((projects) => {
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
        this.element.querySelector("ul").id = listId;
        this.element.querySelector("h2").textContent =
            `${this.type} projects`.toUpperCase();
    }
    renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`);
        listEl.innerHTML = "";
        for (const prjItem of this.assignedProject) {
            new ProjectItem(this.element.querySelector('ul').id, prjItem);
        }
    }
}
__decorate([
    AutoBind
], ProjectList.prototype, "dragLeaveHandler", null);
__decorate([
    AutoBind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    AutoBind
], ProjectList.prototype, "dropHandler", null);
// Project input class
class ProjectInput extends Component {
    constructor() {
        super("project-input", "app", true, "user-input");
        this.titleElement = this.element.querySelector("#title");
        this.descriptionElement = this.element.querySelector("#description");
        this.peopleElement = this.element.querySelector("#people");
        this.configure();
    }
    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }
    renderContent() { }
    gatherUserInput() {
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
        if (validate(titleValidatable) &&
            validate(descriptionValidatable) &&
            validate(peopleValidatable)) {
            return [inputedTitle, inputedDescription, +inputedPeople];
        }
        else {
            alert("Invalid Input!!! Please try again");
        }
    }
    clearInput() {
        this.titleElement.value = "";
        this.descriptionElement.value = "";
        this.peopleElement.value = "";
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, numPeople] = userInput;
            projectState.addProject(title, description, numPeople);
            this.clearInput();
        }
    }
}
__decorate([
    AutoBind
], ProjectInput.prototype, "submitHandler", null);
const projectInput = new ProjectInput();
const activeProjects = new ProjectList("active");
const finishedProjects = new ProjectList("finished");
