import { Option, fromNullable } from "fp-ts/lib/Option";
import { IConfig } from "../config";
import { SortKey, createDocument, findByPartitionKey, removeAttr, updateDocument } from ".";
import { GuidedDiscussionActions } from "../../entities/guided-discussion-actions";

/*
 * attr2 (string) - guideId
 * attr3 (string) - personId
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<GuidedDiscussionActions>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.GuidedDiscussionActions) as GuidedDiscussionActions);
}
export async function createDiscussionAction(config: IConfig, guidedDiscussion: GuidedDiscussionActions) {
  const document: Record<string, any> = { ...guidedDiscussion };
  document._pk = guidedDiscussion.id;
  document._sk = SortKey.GuidedDiscussionActions;
  document.attr2 = guidedDiscussion.guideId;
  document.attr3 = guidedDiscussion.explorerId;
  document.attr4 = guidedDiscussion.createdAt;

  await createDocument(config, document);
}
export async function updateDiscussionActions(config: IConfig, discussionActions: GuidedDiscussionActions, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...discussionActions };
  document._pk = discussionActions.id;
  document._sk = SortKey.GuidedDiscussionActions;
  if (discussionActions.guideId != null) {
    document.attr2 = discussionActions.guideId;
    fieldsToUpdate.push("attr2");
  }

  await updateDocument(config, document, fieldsToUpdate);
}
export async function removeFields(config: IConfig, id: string, fieldsToRemove: string[]) {
  await removeAttr(config, id, SortKey.GuidedDiscussionActions, fieldsToRemove.join(','));
}
