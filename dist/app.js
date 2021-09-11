"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
console.log("==== PRACTICE PROJECT ====");
// Project state class
class ProjectState {
    constructor() {
        this.projects = [];
        this.listeners = [];
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new ProjectState();
        }
        return this.instance;
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
    addProject(title, description, numPeople) {
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
// Project list class
class ProjectList {
    constructor(type) {
        this.type = type;
        this.assignedProject = [];
        this.templateElement = document.getElementById("project-list");
        this.hostElement = document.getElementById("app");
        // this.assignedProject = [];
        const tempContent = document.importNode(this.templateElement.content, true);
        this.element = tempContent.firstElementChild;
        this.element.id = `${this.type}-projects`;
        projectState.addListener((projects) => {
            this.assignedProject = projects;
            this.renderProjects();
        });
        this.attach();
        this.renderContent();
        this.renderProjects();
    }
    renderProjects() {
        const listEl = document.getElementById(`${this.type}-projects-list`);
        for (const prjItem of this.assignedProject) {
            const listItem = document.createElement("li");
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem);
        }
    }
    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul").id = listId;
        this.element.querySelector("h2").textContent =
            `${this.type} projects`.toUpperCase();
    }
    attach() {
        this.hostElement.insertAdjacentElement("beforeend", this.element);
    }
}
// Project input class
class ProjectInput {
    constructor() {
        this.templateElement = document.getElementById("project-input");
        this.hostElement = document.getElementById("app");
        const tempContent = document.importNode(this.templateElement.content, true);
        this.element = tempContent.firstElementChild;
        this.titleElement = this.element.querySelector("#title");
        this.descriptionElement = this.element.querySelector("#description");
        this.peopleElement = this.element.querySelector("#people");
        this.element.id = "user-input";
        this.attach();
        this.configure();
    }
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
    configure() {
        this.element.addEventListener("submit", this.submitHandler);
    }
    attach() {
        this.hostElement.insertAdjacentElement("afterbegin", this.element);
    }
}
__decorate([
    AutoBind
], ProjectInput.prototype, "submitHandler", null);
const projectInput = new ProjectInput();
const activeProjects = new ProjectList("active");
const finishedProjects = new ProjectList("finished");
