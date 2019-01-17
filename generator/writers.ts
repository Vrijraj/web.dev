import * as handlebars from 'handlebars';
import * as path from 'path';

import {loadContributorFromConfiguration} from './contributors.js';
import {GuideHTMLFileWithMetadata, LearningPath, PathTopic, RootCards, SerializedGuideJson, TopLevelFile} from './file-types.js';
import * as fs from './fsp.js';
import {markdown} from './markdown.js';

const TEMPLATE_DIRECTORY = path.resolve(__dirname, '..', '..', 'templates');

function readTemplate(templateName: string) {
  return handlebars.compile(fs.readFileSync(
      path.resolve(TEMPLATE_DIRECTORY, `${templateName}.html`), 'utf8'));
}

const PATH_TEMPLATE = readTemplate('path');
const DEVSITE_TEMPLATE = readTemplate('devsite');
const ROOT_CARDS_TEMPLATE = readTemplate('root-cards');
const GUIDE_TEMPLATE = readTemplate('guide');

export async function writeTopLevelFile(directory: string, file: TopLevelFile) {
  await fs.writeFile(path.resolve(directory, file.name), file.body);
}

async function writeSingleGuide(
    directory: string, learningPath: LearningPath, topic: PathTopic,
    guide: GuideHTMLFileWithMetadata) {
  const guideDirectory = path.resolve(directory, guide.name);

  const main = markdown(guide.body);
  const {title, attributes: {description}} = guide;

  const body = GUIDE_TEMPLATE({
    main,
    learningPath,
    topic,
    author: await loadContributorFromConfiguration(guide.attributes.author),
    ...guide
  });

  await fs.mkdirp(guideDirectory);
  await fs.writeFile(
      path.resolve(guideDirectory, 'index.html'),
      DEVSITE_TEMPLATE({title, meta: {description}, body}));
}

export async function writeLearningPath(directory: string, file: LearningPath) {
  const {name, title, description} = file;

  await fs.writeFile(
      path.resolve(directory, name + '.html'),
      DEVSITE_TEMPLATE(
          {title, meta: {description}, body: PATH_TEMPLATE(file)}));

  const contentDirectoryName = path.resolve(directory, name);
  await fs.mkdirp(contentDirectoryName);

  for (const topic of file.topics) {
    for (const guide of topic.guides) {
      await writeSingleGuide(contentDirectoryName, file, topic, guide);
    }
  }
}

export async function writeRootCards(directory: string, cards: RootCards) {
  await fs.writeFile(
      path.resolve(directory, '_root-cards.html'), ROOT_CARDS_TEMPLATE(cards));
}

export async function writeSerializedGuideJson(
    directory: string, allGuides: SerializedGuideJson[]) {
  await fs.writeFile(
      path.resolve(directory, '_guides-json.html'),
      JSON.stringify({guides: allGuides}));
}