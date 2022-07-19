"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplatesAndPackage = exports.getFeaturesAndPackage = exports.addCollectionsMetadataFile = exports.renameLocal = exports.mkdirLocal = exports.writeLocalFile = exports.readLocalFile = void 0;
const github = __importStar(require("@actions/github"));
// import * as tar from 'tar';
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const child_process = __importStar(require("child_process"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
exports.readLocalFile = (0, util_1.promisify)(fs.readFile);
exports.writeLocalFile = (0, util_1.promisify)(fs.writeFile);
exports.mkdirLocal = (0, util_1.promisify)(fs.mkdir);
exports.renameLocal = (0, util_1.promisify)(fs.rename);
// Filter what gets included in the tar.c
// const filter = (file: string, _: tar.FileStat) => {
//     // Don't include the archive itself.
//     if (file === './devcontainer-features.tgz') {
//         return false;
//     }
//     return true;
// };
// export async function tarDirectory(path: string, tgzName: string) {
//     return tar.create({ file: tgzName, C: path, filter }, ['.']).then(_ => {
//         core.info(`Compressed ${path} directory to file ${tgzName}`);
//     });
// }
function getSourceInfo() {
    // Insert github repo metadata
    const ref = github.context.ref;
    let sourceInformation = {
        source: 'github',
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref,
        sha: github.context.sha
    };
    // Add tag if parseable
    if (ref.includes('refs/tags/')) {
        const tag = ref.replace('refs/tags/', '');
        sourceInformation = Object.assign(Object.assign({}, sourceInformation), { tag });
    }
    return sourceInformation;
}
function addCollectionsMetadataFile(featuresMetadata, templatesMetadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = path_1.default.join('.', 'devcontainer-collection.json');
        const sourceInformation = getSourceInfo();
        const metadata = {
            sourceInformation,
            features: featuresMetadata || [],
            templates: templatesMetadata || []
        };
        // Write to the file
        yield (0, exports.writeLocalFile)(p, JSON.stringify(metadata, undefined, 4));
    });
}
exports.addCollectionsMetadataFile = addCollectionsMetadataFile;
function getFeaturesAndPackage(basePath, publishToNPM = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const featureDirs = fs.readdirSync(basePath);
        let metadatas = [];
        yield Promise.all(featureDirs.map((f) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            core.info(`feature ==> ${f}`);
            if (!f.startsWith('.')) {
                const featureFolder = path_1.default.join(basePath, f);
                const featureJsonPath = path_1.default.join(featureFolder, 'devcontainer-feature.json');
                if (!fs.existsSync(featureJsonPath)) {
                    core.error(`Feature '${f}' is missing a devcontainer-feature.json`);
                    core.setFailed('All features must have a devcontainer-feature.json');
                    return;
                }
                const featureMetadata = JSON.parse(fs.readFileSync(featureJsonPath, 'utf8'));
                metadatas.push(featureMetadata);
                const sourceInfo = getSourceInfo();
                // Adds a package.json file to the feature folder
                const packageJsonPath = path_1.default.join(featureFolder, 'package.json');
                if (publishToNPM) {
                    core.info(`Publishing to NPM`);
                    if (!sourceInfo.tag) {
                        core.error(`Feature ${f} is missing a tag! Cannot publish to NPM.`);
                        core.setFailed('All features published to NPM must be tagged with a version');
                    }
                    const packageJsonObject = {
                        name: `@${sourceInfo.owner}/${sourceInfo.repo}-${f}`,
                        version: `${sourceInfo.tag}`,
                        description: `${(_a = featureMetadata.description) !== null && _a !== void 0 ? _a : 'My cool feature'}`,
                        repository: {
                            type: 'git',
                            url: `https://github.com/${sourceInfo.owner}/${sourceInfo.repo}.git`
                        },
                        author: `${sourceInfo.owner}`
                    };
                    yield (0, exports.writeLocalFile)(packageJsonPath, JSON.stringify(packageJsonObject, undefined, 4));
                    // const tarData = await pac.tarball(featureFolder);
                    // const archiveName = `${sourceInfo.owner}-${sourceInfo.repo}-${f}.tgz`; // TODO: changed this!
                    core.info(`Feature Folder is: ${featureFolder}`);
                    const packageName = child_process.execSync(`npm pack ./${featureFolder}`);
                    core.info(`GENERATED: ${packageName.toString()}`);
                    const output2 = child_process.execSync(`npm publish ${packageName} --access public`);
                    core.info(output2.toString());
                }
                // TODO: Old way, GitHub release
                // await tarDirectory(featureFolder, archiveName);
            }
        })));
        if (metadatas.length === 0) {
            core.setFailed('No features found');
            return;
        }
        return metadatas;
    });
}
exports.getFeaturesAndPackage = getFeaturesAndPackage;
function getTemplatesAndPackage(basePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const templateDirs = fs.readdirSync(basePath);
        let metadatas = [];
        yield Promise.all(templateDirs.map((t) => __awaiter(this, void 0, void 0, function* () {
            core.info(`template ==> ${t}`);
            if (!t.startsWith('.')) {
                const templateFolder = path_1.default.join(basePath, t);
                const archiveName = `devcontainer-template-${t}.tgz`;
                // await tarDirectory(templateFolder, archiveName);
                const templateJsonPath = path_1.default.join(templateFolder, 'devcontainer-template.json');
                if (!fs.existsSync(templateJsonPath)) {
                    core.error(`Template '${t}' is missing a devcontainer-template.json`);
                    core.setFailed('All templates must have a devcontainer-template.json');
                    return;
                }
                const templateMetadata = JSON.parse(fs.readFileSync(templateJsonPath, 'utf8'));
                metadatas.push(templateMetadata);
            }
        })));
        if (metadatas.length === 0) {
            core.setFailed('No templates found');
            return;
        }
        return metadatas;
    });
}
exports.getTemplatesAndPackage = getTemplatesAndPackage;
