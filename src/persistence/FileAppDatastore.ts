import { AppDatastore } from "../core/AppDatastore.ts";
import { AppSetting } from "../core/AppSetting.ts";
import { Gym } from "../core/Gym.ts";
import { UserNotificationSetting } from "../core/NotificationSetting.ts";
import { fs } from "../deps.ts";
import { logger } from "../log.ts";

export class FileAppDatastore implements AppDatastore {
  dataPath: string;
  userNotificationSettings: UserNotificationSetting[];
  constructor(appDataPath: string = Deno.env.get("APP_DATA_PATH") || "data") {
    this.dataPath = appDataPath;
    this.userNotificationSettings = [];
  }

  async init() {
    fs.ensureDirSync(this.dataPath);
    const filePath = `${this.dataPath}/app.json`;
    if (fs.existsSync(filePath)) {
      this.userNotificationSettings = this._readJson(filePath).userNotification;
    }
    logger.debug("App Datastore is ready");
  }

  async getUserNotification(
    chat_id: number,
    gym: Gym,
  ): Promise<UserNotificationSetting | undefined> {
    return this.userNotificationSettings.find(
      (uns) => uns.chat_id === chat_id && uns.gym === gym,
    );
  }

  async addOrUpdateUserNotification(
    userNotConfig: UserNotificationSetting,
  ): Promise<void> {
    const { gym, chat_id } = userNotConfig;
    const existingConfigIndex = this.userNotificationSettings.findIndex(
      (uns) => uns.chat_id === chat_id && uns.gym === gym,
    );
    if (existingConfigIndex !== -1) {
      this.userNotificationSettings[existingConfigIndex] = userNotConfig;
    } else {
      this.userNotificationSettings.push(userNotConfig);
    }
    return fs.writeJson(
      `${this.dataPath}/app.json`,
      {
        userNotification: this.userNotificationSettings,
      },
      { spaces: 2 },
    );
  }

  async removeUserNotification(chat_id: number, gym: Gym): Promise<void> {
    const filteredUserNotification = this.userNotificationSettings.filter(
      (uns) => !(uns.chat_id === chat_id && uns.gym === gym),
    );
    this.userNotificationSettings = filteredUserNotification;
    return fs.writeJson(
      `${this.dataPath}/app.json`,
      {
        userNotification: this.userNotificationSettings,
      },
      { spaces: 2 },
    );
  }

  _readJson(path: string): AppSetting {
    const { userNotification } = fs.readJsonSync(path) as AppSetting;
    return {
      userNotification: userNotification.map((e) => ({
        ...e,
        lastAlmostFullNotification: e.lastAlmostFullNotification
          ? new Date(e.lastAlmostFullNotification)
          : undefined,
        lastFreeNotification: e.lastFreeNotification
          ? new Date(e.lastFreeNotification)
          : undefined,
        lastFullNotification: e.lastFullNotification
          ? new Date(e.lastFullNotification)
          : undefined,
      })),
    };
  }
}
