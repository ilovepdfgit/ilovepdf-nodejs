import TaskFactory, { TaskFactoryI } from "@ilovepdf/ilovepdf-core/dist/tasks/TaskFactory";
import Auth from "@ilovepdf/ilovepdf-core/dist/auth/Auth";
import JWT from "@ilovepdf/ilovepdf-core/dist/auth/JWT";
import ILovePDFTool from "@ilovepdf/ilovepdf-core/dist/types/ILovePDFTool";
import XHRPromise from "./XHRPromise";
import XHRInterface from '@ilovepdf/ilovepdf-core/dist/utils/XHRInterface';
import globals from '@ilovepdf/ilovepdf-core/dist/constants/globals.json';
import { TaskParams } from "@ilovepdf/ilovepdf-core/dist/tasks/Task";
import TaskI from "@ilovepdf/ilovepdf-core/dist/tasks/TaskI";

export interface ILovePDFApiI {
    newTask: (taskType: ILovePDFTool, params?: TaskParams) => TaskI;
    getTask: (taskId: string) => Promise<TaskI>;
    listTasks: (params?: ILovePDFApiParams) => Promise< Array<TaskI> >;
}

type ILovePDFApiParams = {
    page?: number;
    tool?: string;
    status?: string;
    custom_int?: number;
};

export default class ILovePDFApi implements ILovePDFApiI {
    private auth: Auth;
    private xhr: XHRInterface;
    private taskFactory: TaskFactoryI;

    constructor(publicKey: string, secretKey: string) {
        this.xhr = new XHRPromise;
        // Secret key is set for
        this.auth = new JWT(this.xhr, publicKey, secretKey);
        this.taskFactory = new TaskFactory();
    }

    public newTask(taskType: ILovePDFTool, params: TaskParams = {}) {
        return this.taskFactory.newTask(taskType, this.auth, this.xhr, params);
    }

    public async getTask(taskId: string) {
        const token = await this.auth.getToken();

        return this.xhr.get(
            `${ globals.API_URL_PROTOCOL }://${ globals.API_URL }/${ globals.API_VERSION }/task/${ taskId }`,
            {
                headers: [
                    [ 'Authorization', `Bearer ${ token }` ]
                ],
                transformResponse: (res: any) => { return JSON.parse(res) }
            }
        )
        .then(data => {
            // This API call causes now ALWAYS an error. It has to be fixed.
            throw new Error(JSON.stringify(data));
        });
    }

    public async listTasks(params: ILovePDFApiParams = {}) {
        const token = await this.auth.getToken();

        return this.xhr.post<ListTasksResponse>(
            `${ globals.API_URL_PROTOCOL }://${ globals.API_URL }/${ globals.API_VERSION }/task`,
            {
                secret_key: this.auth.secretKey,
                ...params
            },
            {
                headers: [
                    [ 'Authorization', `Bearer ${ token }` ]
                ],
                transformResponse: (res: any) => { return JSON.parse(res) }
            }
        )
        .then(response => {
            const fileArray = response.map(data => (
                // In this call, files are not included.
                this.newTask(data.tool, { id: data.task, server: data.server })
            ));

            return fileArray;
        });
    }

}

// ILovePDF type responses from API.

type ListTasksResponse = Array< {
    tool: ILovePDFTool;
    process_start: string;
    status: string;
    status_message: string;
    timer: string;
    filesize: number;
    output_filesize: number;
    output_filenumber: number;
    output_extensions: Array<string>;
    server: string;
    task: string;
    file_number: string;
    download_filename: string;
} >;

// -----