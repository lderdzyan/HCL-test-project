import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import config from "../../config";
import { Logger } from "../logger";

export async function getCredentials(pid: string) {
  const stsClient = new STSClient({ region: config.awsConfig!.region });

  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: config.awsConfig?.stsConfig.uploadRoleArn,
    RoleSessionName: `fileUpload_${pid}`,
  });

  try {
    const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
    const { Credentials } = assumeRoleResponse;

    if (!Credentials) {
      throw new Error("Failed to obtain temporary credentials");
    }

    return Credentials;

  } catch (error) {
    Logger.error("Error assuming role", error);
    throw new Error('STS_ROLE_ASSUME_ERROR');
  }
}
