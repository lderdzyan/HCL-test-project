import { Option, fromNullable, isSome } from "fp-ts/lib/Option";
import { SortKey, createDocument, findByPartitionKey, queryByAttr, updateDocument } from ".";
import { FileUpload } from "../../entities/file-upload";
import { IConfig } from "../config";
import { FileUploadTypes } from "../../constants";

/*
 * attr1 (string) - type
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<FileUpload>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.FileUpload) as FileUpload);
}

export async function createFileUpload(config: IConfig, file: FileUpload) {
  const document: Record<string, any> = { ...file };
  document._pk = file.id;
  document._sk = SortKey.FileUpload;
  document.attr1 = file.type;
  document.attr3 = file.createdBy;
  document.attr4 = file.createdAt;

  await createDocument(config, document);
}

export async function getAllFilesByType(config: IConfig, type: FileUploadTypes): Promise<FileUpload[]> {
  const data = await queryByAttr(
    config,
    'attr1',
    type,
    SortKey.FileUpload,
    '#attr = :attrValue',
    'attr1-index',
  );

  const uploads: FileUpload[] = [];
  for (const item of data) {
    const fixedDiscussion = fromNullable(item as FileUpload);
    if (isSome(fixedDiscussion)) {
      uploads.push(fixedDiscussion.value);
    }
  }

  return uploads;
}
export async function updateFileUpload(config: IConfig, fileUpload: FileUpload, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...fileUpload };
  document._pk = fileUpload.id;
  document._sk = SortKey.FileUpload;

  await updateDocument(config, document, fieldsToUpdate);
}
