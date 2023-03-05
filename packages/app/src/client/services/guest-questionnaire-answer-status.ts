// A service to manage questionnaire answer statuses for guest user.
// Saves statuses in localStorage.

import { StatusType } from '~/interfaces/questionnaire/questionnaire-answer-status';

interface GuestQuestionnaireAnswerStatus {
  status: StatusType
  updatedDate: string
}

interface GuestQuestionnaireAnswerStatusStorage {
  [key: string]: GuestQuestionnaireAnswerStatus
}

const storageKey = 'guestQuestionnaireAnswerStatuses';
const daysUntilExpiration = 30;

/**
 * Get all answer statuses stored in localStorage as GuestQuestionnaireAnswerStatusStorage,
 * and update outdated information.
 */
const getStorage = (): GuestQuestionnaireAnswerStatusStorage | null => {
  if (typeof window !== 'undefined') {
    const currentStorage = localStorage.getItem(storageKey);
    if (currentStorage) {
      const storageJson: GuestQuestionnaireAnswerStatusStorage = JSON.parse(currentStorage);

      // delete status if outdated
      // change skipped to not_answered if different date than when skipped
      Object.keys(storageJson).forEach((key) => {
        const answerStatus = storageJson[key];
        const updatedDate = new Date(answerStatus.updatedDate);
        const expirationDate = new Date(updatedDate.setDate(updatedDate.getDate() + daysUntilExpiration));
        if (expirationDate < new Date()) {
          delete storageJson[key];
        }
        else if (answerStatus.status === StatusType.skipped
          && new Date().toDateString() !== answerStatus.updatedDate) {
          storageJson[key] = {
            status: StatusType.not_answered,
            updatedDate: new Date().toDateString(),
          };
        }
      });

      return storageJson;
    }
  }
  return null;
};

/**
 * Set answer status for questionnaire order in GuestQuestionnaireAnswerStatusStorage,
 * and save it in localStorage.
 */
const setStatus = (questionnaireOrderId: string, status: StatusType): void => {
  if (typeof window !== 'undefined') {
    const guestQuestionnaireAnswerStatus: GuestQuestionnaireAnswerStatus = {
      status,
      updatedDate: new Date().toDateString(),
    };

    const storage = getStorage();

    if (storage) {
      storage[questionnaireOrderId] = guestQuestionnaireAnswerStatus;
      localStorage.setItem(storageKey, JSON.stringify(storage));
    }
    else {
      const initialStorage: GuestQuestionnaireAnswerStatusStorage = { [questionnaireOrderId]: guestQuestionnaireAnswerStatus };
      localStorage.setItem(storageKey, JSON.stringify(initialStorage));
    }
  }
};

export const GuestQuestionnaireAnswerStatusService = {
  setStatus,
  getStorage,
};
