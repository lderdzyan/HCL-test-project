import { LoginStatus } from '../../constants';
import { IFilterData, QueryByAttrBetweenArg, SortKey, createDocument, queryByAttrBetween } from '.';
import { LoginData } from '../../entities/login-data';
import { IConfig } from '../config';

/*
 * attr1 (string) - status
 * attr2 (string) - personId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, data: LoginData) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = SortKey.LoginData;
  document.attr1 = data.status;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;
  document.attr2 = data.personId;

  await createDocument(config, document);
}
export async function findAllByStatus(
  config: IConfig,
  data: { startOfDate: number; endOfDate: number; status?: LoginStatus },
): Promise<LoginData[]> {
  const arg: QueryByAttrBetweenArg = {
    awsConfig: config,
    attrName: 'attr4',
    value1: data.startOfDate,
    value2: data.endOfDate,
    sortKeyValue: SortKey.LoginData,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  };
  if (data.status != null) {
    arg.filterInfo = {
      expression: '#filterAttr = :filterValue',
      names: { '#filterAttr': 'attr1' },
      values: { ':filterValue': data.status },
    } as IFilterData;
  }
  const items = await queryByAttrBetween(arg);
  const loginDataList: LoginData[] = [];

  for (const item of items) {
    if (item != null) {
      loginDataList.push(item as LoginData);
    }
  }

  return loginDataList;
}
