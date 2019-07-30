import { IframePostOfficeWindow } from '../../../windowTypes'
import {
  ConstantsType,
  FetchWindow,
  SetTimeoutWindow,
  WalletServiceType,
  Web3ServiceType,
  BlockchainData,
} from '../../../data-iframe/blockchainHandler/blockChainTypes'
import Mailbox from '../../../data-iframe/Mailbox'
import {
  setupTestDefaults,
  MailboxTestDefaults,
} from '../../test-helpers/setupMailboxHelpers'
import FakeWindow from '../../test-helpers/fakeWindowHelpers'
import {
  getWalletService,
  getWeb3Service,
  lockAddresses,
  addresses,
} from '../../test-helpers/setupBlockchainHelpers'
import { TransactionType, TransactionStatus } from '../../../unlockTypes'

let mockWalletService: WalletServiceType
let mockWeb3Service: Web3ServiceType
jest.mock('@unlock-protocol/unlock-js', () => {
  return {
    WalletService: () => {
      mockWalletService = getWalletService({})
      mockWalletService.connect = jest.fn((provider: any) => {
        mockWalletService.provider = provider
        return Promise.resolve()
      })
      return mockWalletService
    },
    Web3Service: () => {
      mockWeb3Service = getWeb3Service({})
      return mockWeb3Service
    },
  }
})

describe('Mailbox - getDataToSend', () => {
  let constants: ConstantsType
  let win: FetchWindow & SetTimeoutWindow & IframePostOfficeWindow
  let fakeWindow: FakeWindow
  let mailbox: Mailbox
  let defaults: MailboxTestDefaults

  const account = addresses[1]
  // all locks have had their addresses normalized before arriving
  const lockedLocks: BlockchainData = {
    account: addresses[1],
    balance: '234',
    network: 1984,
    locks: {
      [lockAddresses[0]]: {
        address: lockAddresses[0],
        name: '1',
        expirationDuration: 5,
        currencyContractAddress: addresses[2],
        keyPrice: '1',
        key: {
          status: 'none',
          confirmations: 0,
          expiration: 0,
          transactions: [],
          owner: account,
          lock: lockAddresses[0],
        },
      },
      [lockAddresses[1]]: {
        address: lockAddresses[1],
        name: '1',
        expirationDuration: 5,
        currencyContractAddress: addresses[2],
        keyPrice: '1',
        key: {
          status: 'expired',
          confirmations: 1678234,
          expiration: 163984,
          transactions: [
            {
              status: TransactionStatus.MINED,
              confirmations: 1678234,
              hash: 'hash',
              type: TransactionType.KEY_PURCHASE,
              blockNumber: 123,
            },
          ],
          owner: account,
          lock: lockAddresses[0],
        },
      },
    },
  }

  function setupDefaults() {
    defaults = setupTestDefaults()
    constants = defaults.constants
    win = defaults.fakeWindow
    fakeWindow = win as FakeWindow
    mailbox = new Mailbox(constants, fakeWindow)
  }

  function testingMailbox() {
    return mailbox as any
  }

  describe('failures', () => {
    beforeEach(() => {
      setupDefaults()
      fakeWindow.localStorage.clear = jest.fn()
    })

    type Examples = [string, any]
    it.each(<Examples[]>[
      ['null', null],
      ['false', false],
      ['5', 5],
      ['a string', 'something'],
      ['an array', []],
      ['a cache that is missing keys', { locks: 1, account: 1 }],
      [
        'a cache that has extra keys',
        { locks: 1, account: 1, balance: 1, network: 3, three: 3 },
      ],
      [
        'a cache that has wrong keys',
        { locks: 1, account: 1, balance: 1, three: 3 },
      ],
      [
        'a cache with invalid locks',
        {
          locks: { hi: 'there' },
          account: addresses[1],
          balance: '0',
          network: 1,
        },
      ],
      [
        'a cache with invalid account',
        {
          locks: lockedLocks.locks,
          account: '0x1234',
          balance: '0',
          network: 1,
        },
      ],
      [
        'a cache with invalid balance',
        {
          locks: lockedLocks.locks,
          account: '0x1234',
          balance: '0f',
          network: 1,
        },
      ],
      [
        'a cache with invalid network',
        {
          locks: lockedLocks.locks,
          account: addresses[0],
          balance: '17.243',
          network: 2,
        },
      ],
    ])('should fail on receiving %s', (_, badData) => {
      expect.assertions(2)

      expect(mailbox.sanitizeBlockchainData(badData)).toBe(
        testingMailbox().defaultBlockchainData
      )
      expect(fakeWindow.localStorage.clear).toHaveBeenCalled()
    })
  })

  describe('success', () => {
    beforeEach(() => {
      setupDefaults()
    })

    type Examples = [string, BlockchainData]
    it.each(<Examples[]>[
      ['full example', lockedLocks],
      [
        'null account',
        {
          ...lockedLocks,
          account: null,
        },
      ],
      [
        'mainnet network',
        {
          ...lockedLocks,
          network: 1,
        },
      ],
      [
        'staging network',
        {
          ...lockedLocks,
          network: 4,
        },
      ],
      [
        'dev network',
        {
          ...lockedLocks,
          network: 1984,
        },
      ],
    ])('should return the input for valid %s', (_, data) => {
      expect.assertions(1)

      expect(mailbox.sanitizeBlockchainData(data)).toBe(data)
    })
  })
})
