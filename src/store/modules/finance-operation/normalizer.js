import { userWalletMapper } from '../user-wallet/normalizer';
import { userMapper } from '../user/normalizer';

export const financeOperationsMapper = function(financeOperations) {
  let result = [];

  result = {
    ...result,
    ...financeOperations.reduce(
      (prev, financeOperation) => ({
        ...prev,
        [financeOperation.id]: financeOperationMapper(financeOperation)
      }),
      {}
    )
  };

  return result;
};

export const financeOperationMapper = financeOperation => ({
  id: financeOperation.id,
  money: financeOperation.money,
  type: presentTypes(financeOperation.type),
  status: presentStatus(financeOperation.status),
  user: userMapper(financeOperation.user),
  createdAt: financeOperation.createdAt,
  wallet: financeOperation.wallet
    ? userWalletMapper(financeOperation.wallet)
    : { info: 'Info' },
  canceledAt: financeOperation.canceledAt,
  canceledInfo: financeOperation.canceledInfo
});

function presentTypes(type) {
  switch (type) {
    case Vue.prototype.$getConst('FINANCE_OPERATION_TYPE').ENROLLMENT:
      return {
        value: Vue.prototype.$getConst('FINANCE_OPERATION_TYPE').ENROLLMENT,
        title: 'Enrollment',
        isEnrollment: true
      };
    case Vue.prototype.$getConst('FINANCE_OPERATION_TYPE').WRITE_OFFS:
      return {
        value: Vue.prototype.$getConst('FINANCE_OPERATION_TYPE').WRITE_OFFS,
        title: 'Write Offs',
        isEnrollment: false
      };
    default:
      return null;
  }
}

function presentStatus(status) {
  switch (status) {
    case Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').CREATED:
      return {
        title: 'Created',
        variant: 'warning',
        value: Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').CREATED,
        isExecuted: false,
        isCanceled: false
      };
    case Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').EXECUTED:
      return {
        title: 'Executed',
        variant: '',
        value: Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').EXECUTED,
        isExecuted: true,
        isCanceled: false
      };
    case Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').PENDING:
      return {
        title: 'Pending',
        variant: 'warning',
        value: Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').PENDING,
        isExecuted: false,
        isCanceled: false
      };
    case Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').CANCELED:
      return {
        title: 'Canceled',
        variant: '',
        value: Vue.prototype.$getConst('FINANCE_OPERATION_STATUS').EXECUTED,
        isExecuted: false,
        isCanceled: true
      };
    default:
      return null;
  }
}
