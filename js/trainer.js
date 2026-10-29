const QUESTIONS_URL = 'data/questions.json';
const FORBIDDEN_CHARACTERS_PATTERN = /[^А-Яа-яЁё -]/g;
const VOWELS_PATTERN = /([аеёиоуыэюя])/gi;
const RESULT_HEADERS = ['#', 'Картинка', 'Правильный ответ', 'Твой ответ', 'Результат'];

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createHighlightedCell(tagName, text) {
  const cell = createElement(tagName);
  text.split(VOWELS_PATTERN).forEach((part, index) => {
    cell.append(index % 2 ? createElement('span', 'vowel', part) : part);
  });
  return cell;
}

function shuffleItems(items) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }
  return shuffledItems;
}

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase();
}

function createImage(source, className) {
  const image = createElement('img', className);
  image.src = source;
  image.alt = 'Картинка вопроса';
  image.draggable = false;
  return image;
}

class Trainer {
  constructor(rootElement, sourceQuestions) {
    this.rootElement = rootElement;
    this.sourceQuestions = sourceQuestions;
    this.restart();
  }

  get resultsIndex() {
    return this.questions.length;
  }

  restart() {
    this.questions = shuffleItems(this.sourceQuestions);
    this.answers = [];
    this.unlockedIndex = 0;
    this.currentIndex = 0;
    this.render();
  }

  openPage(pageIndex) {
    this.currentIndex = pageIndex;
    this.render();
  }

  saveAnswer(answer) {
    this.answers[this.currentIndex] = answer;
    const nextIndex = this.currentIndex + 1;
    this.unlockedIndex = Math.max(this.unlockedIndex, nextIndex);
    this.openPage(nextIndex);
  }

  isAnswerCorrect(questionIndex) {
    return normalizeAnswer(this.answers[questionIndex]) === normalizeAnswer(this.questions[questionIndex].answer);
  }

  render() {
    const workspace = createElement('div', 'workspace');
    const isResultsPage = this.currentIndex === this.resultsIndex;
    const card = createElement('main', 'card');
    card.append(isResultsPage ? this.createResults() : this.createQuestion());
    workspace.append(this.createTabs(), card, this.createResetButton());
    this.rootElement.replaceChildren(workspace);
  }

  createTabs() {
    const tabs = createElement('nav', 'tabs');
    for (let pageIndex = 0; pageIndex <= this.resultsIndex; pageIndex++) {
      const tab = createElement('button', 'tab', pageIndex + 1);
      tab.classList.toggle('is-current', pageIndex === this.currentIndex);
      tab.disabled = pageIndex > this.unlockedIndex;
      tab.addEventListener('click', () => this.openPage(pageIndex));
      tabs.append(tab);
    }
    return tabs;
  }

  createResetButton() {
    const resetButton = createElement('button', 'reset-button', '✕');
    resetButton.addEventListener('click', () => this.restart());
    return resetButton;
  }

  createQuestion() {
    const question = this.questions[this.currentIndex];
    const savedAnswer = this.answers[this.currentIndex] ?? '';
    const container = createElement('section', 'question');
    const field = createElement('div', 'answer-field');
    const label = createElement('label', 'answer-label', `Напечатай: ${question.answer}`);
    const row = createElement('div', 'answer-row');
    const input = createElement('input', 'answer-input');
    const checkButton = createElement('button', 'check-button', '✔');

    input.type = 'text';
    input.value = savedAnswer;
    checkButton.disabled = !input.value.trim();

    input.addEventListener('input', () => {
      input.value = input.value.replace(FORBIDDEN_CHARACTERS_PATTERN, '');
      checkButton.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !checkButton.disabled) {
        checkButton.click();
      }
    });
    checkButton.addEventListener('click', () => this.saveAnswer(input.value));

    label.append(row);
    row.append(input, checkButton);
    field.append(label);
    container.append(createImage(question.image, 'question-image'), field);
    return container;
  }

  createResults() {
    const table = createElement('table', 'results');
    const headerRow = table.createTHead().insertRow();
    RESULT_HEADERS.forEach((title) => headerRow.append(createHighlightedCell('th', title)));

    const body = table.createTBody();
    this.questions.forEach((question, questionIndex) => {
      const row = body.insertRow();
      const imageCell = createElement('td');
      const isCorrect = this.isAnswerCorrect(questionIndex);
      const resultIcon = createElement('span', 'result-icon', isCorrect ? '✔' : '✖');
      const resultCell = createElement('td');

      resultIcon.classList.toggle('is-correct', isCorrect);
      imageCell.append(createImage(question.image, 'results-image'));
      resultCell.append(resultIcon);
      row.append(
        createElement('td', '', questionIndex + 1),
        imageCell,
        createHighlightedCell('td', question.answer),
        createHighlightedCell('td', this.answers[questionIndex]),
        resultCell
      );
    });
    return table;
  }
}

fetch(QUESTIONS_URL)
  .then((response) => response.json())
  .then((questions) => new Trainer(document.getElementById('app'), questions));
