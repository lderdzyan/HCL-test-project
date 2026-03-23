import { createDeletedGuide, deleteGuide, GuideDetails, loadAllGuides } from "../../entities/guide-profile";

export namespace GuidesCleanUp {
  export async function removeNotUsedGuides() {
    const guides: GuideDetails[] = await loadAllGuides();
    const needToDeleteGuides: GuideDetails[] = guides.filter((item: GuideDetails) => item.calendlyUserId == null);

    for (const guideProfile of needToDeleteGuides) {
      await removeGuide(guideProfile);
    }
  }

  async function removeGuide(guide: GuideDetails) {
    await createDeletedGuide(guide);
    await deleteGuide(guide.id!);
  }
}
