import axios, { AxiosResponse } from 'axios';
import { GuideProfile, loadAllGuides, updateGuideProfile } from '../../entities/guide-profile';
import { findAllUsersByPid, UserProfile } from '../../entities/user-profile';

export namespace GuideCalendlyData {
  // Define the response type for better type safety
  interface ApiResponse {
    data: any;
  }

  export async function updateGuideInformation() {
    const guides: GuideProfile[] = await loadAllGuides();
    const dataSet: any = {};
    const guidesSetById: any = {}
    for (const guide of guides) {
      const users: UserProfile[] = await findAllUsersByPid(guide.id!);
      guidesSetById[guide.id!] = guide;
      const emails = users.map(user => user.email).filter(item => item != null);
      for (const email of emails) {
        if (email != null)
          dataSet[email] = guide.id!;
      }
    }

    console.log(dataSet);
    // This is dev guide account id which is tied to calendly devone.
    // dataSet['ops.calendly+devone@meaningsphere.com'] = 'ikz3rqyo99s6hsczooyi0co5';
    // This is ua guide accounts id which is tied to calendly uaone.
    // dataSet['ops.calendly+uaone@meaningsphere.com'] = 'fklvf7aa5wbcym6z9shh1mun';
    // This is prerode accounts id which is tied to calendly preprodOne.
    dataSet['ops.calendly+preprodone@meaningsphere.com'] = 'z9l4lk411lov404oswxdnrf3';
    dataSet['joshbarth+test@meaningsphere.com'] = 'iqvqrhextjsr9czlq46p2er1';

    const getOrgInformationUrl = `https://api.calendly.com/organization_memberships?organization=https://api.calendly.com/organizations/${process.env.CALENDLY_ORG_ID}&count=100`;
    try {
      // Make the GET request
      const response: AxiosResponse<ApiResponse> = await axios.get(getOrgInformationUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const resp: any = response.data;
      for (const item of resp['collection']) {
        if (dataSet[item.user.email] != null) {
          const getEventData = `https://api.calendly.com/event_types?user=${item.user.uri}`;
          const eventResponse: AxiosResponse<ApiResponse> = await axios.get(getEventData, {
            headers: {
              'Authorization': `Bearer ${process.env.CALENDLY_TOKEN}`, // Include any required headers
              'Content-Type': 'application/json',
            },
          });
          const events: any = eventResponse.data;
          let slug = process.env.CALENDLY_EVENT_TYPE_SLUG;
          if (item.user.email == 'haleywilliams@meaningsphere.com') slug = '60mins';
          const eventData = events['collection'].find((i: any) => i.slug == slug);
          const updatingGuide: GuideProfile = guidesSetById[dataSet[item.user.email]];
          if (eventData != null) {
            updatingGuide.calendlyEventTypeId = eventData.uri;
            updatingGuide.calendlyUserId = item.user.uri.split('/').pop();
            await updateGuideProfile(updatingGuide, updatingGuide.createdBy!, ['calendlyEventTypeId', 'calendlyUserId']);
          } else {
            console.log(item.user.email);
            console.log("-----", eventData, slug);
          }
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Error making API call:', error.message);
      throw new Error(`Failed to fetch data from ${getOrgInformationUrl}`);
    }
  }

}
