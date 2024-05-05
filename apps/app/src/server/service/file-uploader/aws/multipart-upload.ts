import {
  CreateMultipartUploadCommand, UploadPartCommand, type S3Client, CompleteMultipartUploadCommand, AbortMultipartUploadCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

import loggerFactory from '~/utils/logger';

const logger = loggerFactory('growi:services:fileUploaderAws:multipartUploader');

enum UploadStatus {
  BEFORE_INIT,
  IN_PROGRESS,
  COMPLETED,
  ABORTED
}

// Create abstract interface IMultipartUploader in https://redmine.weseek.co.jp/issues/135775
export interface IAwsMultipartUploader {
  initUpload(): Promise<void>;
  uploadPart(body: Buffer, partNumber: number): Promise<void>;
  completeUpload(): Promise<void>;
  abortUpload(): Promise<void>;
  uploadId: string | undefined;
  getUploadedFileSize(): Promise<number>;
}

/**
 * Class for uploading files to S3 using multipart upload.
 * Create instance from AwsFileUploader class.
 * Each instance can only be used for one multipart upload, and cannot be reused once completed.
 * TODO: Enable creation of uploader of inturrupted uploads: https://redmine.weseek.co.jp/issues/78040
 */
export class AwsMultipartUploader implements IAwsMultipartUploader {

  private bucket: string | undefined;

  private uploadKey: string;

  private _uploadId: string | undefined;

  private s3Client: S3Client;

  private parts: { PartNumber: number; ETag: string | undefined; }[] = [];

  private currentStatus: UploadStatus = UploadStatus.BEFORE_INIT;

  private _uploadedFileSize: number | undefined;

  constructor(s3Client: S3Client, bucket: string | undefined, uploadKey: string) {
    this.s3Client = s3Client;
    this.bucket = bucket;
    this.uploadKey = uploadKey;
  }

  get uploadId(): string | undefined {
    return this._uploadId;
  }

  async initUpload(): Promise<void> {
    this.validateUploadStatus(UploadStatus.BEFORE_INIT);

    const response = await this.s3Client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: this.uploadKey,
    }));
    this._uploadId = response.UploadId;
    this.currentStatus = UploadStatus.IN_PROGRESS;
    logger.info(`Multipart upload initialized. Upload key: ${this.uploadKey}`);
  }

  async uploadPart(body: Buffer, partNumber: number): Promise<void> {
    this.validateUploadStatus(UploadStatus.IN_PROGRESS);

    const uploadMetaData = await this.s3Client.send(new UploadPartCommand({
      Body: body,
      Bucket: this.bucket,
      Key: this.uploadKey,
      PartNumber: partNumber,
      UploadId: this.uploadId,
    }));

    this.parts.push({
      PartNumber: partNumber,
      ETag: uploadMetaData.ETag,
    });
  }

  async completeUpload(): Promise<void> {
    this.validateUploadStatus(UploadStatus.IN_PROGRESS);

    await this.s3Client.send(new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: this.uploadKey,
      UploadId: this.uploadId,
      MultipartUpload: {
        Parts: this.parts,
      },
    }));
    this.currentStatus = UploadStatus.COMPLETED;
    logger.info(`Multipart upload completed. Upload key: ${this.uploadKey}`);
  }

  async abortUpload(): Promise<void> {
    this.validateUploadStatus(UploadStatus.IN_PROGRESS);

    await this.s3Client.send(new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: this.uploadKey,
      UploadId: this.uploadId,
    }));
    this.currentStatus = UploadStatus.ABORTED;
    logger.info(`Multipart upload aborted. Upload key: ${this.uploadKey}`);
  }

  async getUploadedFileSize(): Promise<number> {
    if (this._uploadedFileSize != null) return this._uploadedFileSize;

    this.validateUploadStatus(UploadStatus.COMPLETED);
    const headData = await this.s3Client.send(new HeadObjectCommand({
      Bucket: this.bucket,
      Key: this.uploadKey,
    }));
    this._uploadedFileSize = headData.ContentLength;
    return this._uploadedFileSize ?? 0;
  }

  private validateUploadStatus(desiredStatus: UploadStatus): void {
    if (desiredStatus === this.currentStatus) return;

    let errMsg: string | null = null;

    if (this.currentStatus === UploadStatus.COMPLETED) {
      errMsg = 'Multipart upload has already been completed';
    }

    if (this.currentStatus === UploadStatus.ABORTED) {
      errMsg = 'Multipart upload has been aborted';
    }

    // currentStatus is IN_PROGRESS or BEFORE_INIT

    if (this.currentStatus === UploadStatus.IN_PROGRESS && desiredStatus === UploadStatus.BEFORE_INIT) {
      errMsg = 'Multipart upload has already been initiated';
    }

    if (this.currentStatus === UploadStatus.BEFORE_INIT && desiredStatus === UploadStatus.IN_PROGRESS) {
      errMsg = 'Multipart upload not initiated';
    }

    if (errMsg != null) {
      logger.error(errMsg);
      throw Error(errMsg);
    }
  }

}
