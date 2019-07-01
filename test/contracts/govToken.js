import chai, {expect} from 'chai';
import { ethers, utils } from 'ethers';
import { CPF, CNPJ } from 'cpf_cnpj';
import MD5 from 'crypto-js/md5';
import CryptoJS from 'crypto-js';
import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity
} from 'ethereum-waffle';

import GovToken from '../../build/GovToken';

import {
  ERC1820_REGISTRY_ABI,
  ERC1820_REGISTRY_ADDRESS,
  ERC1820_REGISTRY_BYTECODE,
  ERC1820_REGISTRY_DEPLOY_TX
} from '../utils/data';

// const ERC1820_REGISTRY_DEPLOY_TX = '0xf90a388085174876e800830c35008080b909e5608060405234801561001057600080fd5b506109c5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a5576000357c010000000000000000000000000000000000000000000000000000000090048063a41e7d5111610078578063a41e7d51146101d4578063aabbb8ca1461020a578063b705676514610236578063f712f3e814610280576100a5565b806329965a1d146100aa5780633d584063146100e25780635df8122f1461012457806365ba36c114610152575b600080fd5b6100e0600480360360608110156100c057600080fd5b50600160a060020a038135811691602081013591604090910135166102b6565b005b610108600480360360208110156100f857600080fd5b5035600160a060020a0316610570565b60408051600160a060020a039092168252519081900360200190f35b6100e06004803603604081101561013a57600080fd5b50600160a060020a03813581169160200135166105bc565b6101c26004803603602081101561016857600080fd5b81019060208101813564010000000081111561018357600080fd5b82018360208201111561019557600080fd5b803590602001918460018302840111640100000000831117156101b757600080fd5b5090925090506106b3565b60408051918252519081900360200190f35b6100e0600480360360408110156101ea57600080fd5b508035600160a060020a03169060200135600160e060020a0319166106ee565b6101086004803603604081101561022057600080fd5b50600160a060020a038135169060200135610778565b61026c6004803603604081101561024c57600080fd5b508035600160a060020a03169060200135600160e060020a0319166107ef565b604080519115158252519081900360200190f35b61026c6004803603604081101561029657600080fd5b508035600160a060020a03169060200135600160e060020a0319166108aa565b6000600160a060020a038416156102cd57836102cf565b335b9050336102db82610570565b600160a060020a031614610339576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b6103428361092a565b15610397576040805160e560020a62461bcd02815260206004820152601a60248201527f4d757374206e6f7420626520616e204552433136352068617368000000000000604482015290519081900360640190fd5b600160a060020a038216158015906103b85750600160a060020a0382163314155b156104ff5760405160200180807f455243313832305f4143434550545f4d4147494300000000000000000000000081525060140190506040516020818303038152906040528051906020012082600160a060020a031663249cb3fa85846040518363ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018083815260200182600160a060020a0316600160a060020a031681526020019250505060206040518083038186803b15801561047e57600080fd5b505afa158015610492573d6000803e3d6000fd5b505050506040513d60208110156104a857600080fd5b5051146104ff576040805160e560020a62461bcd02815260206004820181905260248201527f446f6573206e6f7420696d706c656d656e742074686520696e74657266616365604482015290519081900360640190fd5b600160a060020a03818116600081815260208181526040808320888452909152808220805473ffffffffffffffffffffffffffffffffffffffff19169487169485179055518692917f93baa6efbd2244243bfee6ce4cfdd1d04fc4c0e9a786abd3a41313bd352db15391a450505050565b600160a060020a03818116600090815260016020526040812054909116151561059a5750806105b7565b50600160a060020a03808216600090815260016020526040902054165b919050565b336105c683610570565b600160a060020a031614610624576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b81600160a060020a031681600160a060020a0316146106435780610646565b60005b600160a060020a03838116600081815260016020526040808220805473ffffffffffffffffffffffffffffffffffffffff19169585169590951790945592519184169290917f605c2dbf762e5f7d60a546d42e7205dcb1b011ebc62a61736a57c9089d3a43509190a35050565b600082826040516020018083838082843780830192505050925050506040516020818303038152906040528051906020012090505b92915050565b6106f882826107ef565b610703576000610705565b815b600160a060020a03928316600081815260208181526040808320600160e060020a031996909616808452958252808320805473ffffffffffffffffffffffffffffffffffffffff19169590971694909417909555908152600284528181209281529190925220805460ff19166001179055565b600080600160a060020a038416156107905783610792565b335b905061079d8361092a565b156107c357826107ad82826108aa565b6107b85760006107ba565b815b925050506106e8565b600160a060020a0390811660009081526020818152604080832086845290915290205416905092915050565b6000808061081d857f01ffc9a70000000000000000000000000000000000000000000000000000000061094c565b909250905081158061082d575080155b1561083d576000925050506106e8565b61084f85600160e060020a031961094c565b909250905081158061086057508015155b15610870576000925050506106e8565b61087a858561094c565b909250905060018214801561088f5750806001145b1561089f576001925050506106e8565b506000949350505050565b600160a060020a0382166000908152600260209081526040808320600160e060020a03198516845290915281205460ff1615156108f2576108eb83836107ef565b90506106e8565b50600160a060020a03808316600081815260208181526040808320600160e060020a0319871684529091529020549091161492915050565b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff161590565b6040517f01ffc9a7000000000000000000000000000000000000000000000000000000008082526004820183905260009182919060208160248189617530fa90519096909550935050505056fea165627a7a72305820377f4a2d4301ede9949f163f319021a6e9c687c292a5e2b2c4734c126b524e6c00291ba01820182018201820182018201820182018201820182018201820182018201820a01820182018201820182018201820182018201820182018201820182018201820';

chai.use(solidity);

describe('GovToken contracts test', async () => {
  let provider;
  let accounts;
  let funderWallet;
  let governWallet;
  let companyWallet;
  let companyENS = "company.eth";
  let anotherCompanyWallet;
  let anotherCompanyENS = "anotherCompany.eth";
  let contractERC1820Registry;
  let contract;

  let erc1820;

  beforeEach(async () => {
    provider = await createMockProvider({ gasLimit: 800000000 });
    accounts = await getWallets(provider);
    [funderWallet, governWallet, companyWallet, anotherCompanyWallet] = accounts;

    // let erc1820 = await singletons.ERC1820Registry(registryFunder);
    // console.log(erc1820);
    let erc1820 = provider.sendTransaction()
    let transaction = {
        to: "0xa990077c3205cbDf861e17Fa532eeB069cE9fF96",
        value: utils.parseEther("1.0"),
    };

    // Send the ether to transaction
    await funderWallet.sendTransaction(transaction);

    await provider.sendTransaction(ERC1820_REGISTRY_DEPLOY_TX);

    contract = await deployContract(governWallet, GovToken, [], { gasLimit: 10000000 });

  });

  describe("REGISTRATION FUNCTIONS", async() => {

    describe("function register" , async() => {

      it("expect to be a function", async () => {
        expect(contract.register).to.be.an('function');
      });

      it("expect to emit a event called AccountRegister", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        
        await expect(companyContract
          .register(
            companyWallet.address,
            identificationDocument,
            utils.formatBytes32String(companyENS),
            utils.formatBytes32String(hashSignature)
          ))
          .to.emit(contract, 'AccountRegister')
          .withArgs(
            companyWallet.address, 
            identificationDocument,
            utils.formatBytes32String(hashSignature)
          )
      });

      it("expect to be reverted if an address call another time", async() => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        
        await expect(companyContract
            .register(
              companyWallet.address,
              identificationDocument,
              utils.formatBytes32String(companyENS),
              utils.formatBytes32String(hashSignature)
            )
          )
          .to.emit(contract, 'AccountRegister')
          .withArgs(
            companyWallet.address, 
            identificationDocument, 
            utils.formatBytes32String(hashSignature)
          );

        await expect(companyContract
            .register(
              companyWallet.address,
              identificationDocument,
              utils.formatBytes32String(companyENS),
              utils.formatBytes32String(hashSignature)
            )
          )
          .to.be.revertedWith("Address could not be register twice");
      });

      it("expect to set fundRequests as zero on register", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        
        await expect(companyContract
            .register(
              companyWallet.address,
              identificationDocument,
              utils.formatBytes32String(companyENS),
              utils.formatBytes32String(hashSignature)
            )
          )
          .to.emit(contract, 'AccountRegister')
          .withArgs(
            companyWallet.address, identificationDocument, 
            utils.formatBytes32String(hashSignature)
          );

        let [a,b,c,d] = await companyContract.getLPInfo(companyWallet.address)

        expect(d).to.eql([]);
      });

    });

    describe("function getIdentificationDocument", async () => {

      it("expect to return the identification document", async()=> {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        
        await expect(companyContract
            .register(
              companyWallet.address,
              identificationDocument,
              utils.formatBytes32String(companyENS),
              utils.formatBytes32String(hashSignature)
            )
          )
          .to.emit(contract, 'AccountRegister')
          .withArgs(
            companyWallet.address, 
            identificationDocument, 
            utils.formatBytes32String(hashSignature)
          );

        expect(await companyContract
          .getIdentificationDocument(companyWallet.address))
          .to.eq(parseInt(identificationDocument));
      })

      it("expect to return zero if address is not registered", async()=> {
        const companyContract = contract.connect(companyWallet);
        
        expect(await companyContract
          .getIdentificationDocument(companyWallet.address))
          .to.eq(0);
      })

    });

    describe("fucntion getLPInfo", async () => {

      it("expect to return legal person informed", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        
        await expect(companyContract
            .register(
              companyWallet.address, 
              identificationDocument,
              utils.formatBytes32String(companyENS),
              utils.formatBytes32String(hashSignature)
            )
          )
          .to.emit(contract, 'AccountRegister')
          .withArgs(
            companyWallet.address, 
            identificationDocument, 
            utils.formatBytes32String(hashSignature)
          );

        let [a,b,c,d,e] = await companyContract
          .getLPInfo(companyWallet.address)

        expect(a).to.eq(parseInt(identificationDocument));
        expect(b).to.eq(utils.formatBytes32String(companyENS));
        expect(c).to.eq(utils.formatBytes32String(hashSignature));
        expect(d).to.eql([]);
        expect(e).to.eql([]);
      });

    });

    describe("function sendFundRequest", async () => {

      it("expect to revert if address is not registered", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await expect(companyContract
                .sendFundRequest(
                  companyWallet.address,
                  amount,
                  utils.formatBytes32String(hashDocument),
                  utils.formatBytes32String(category),
                  utils.formatBytes32String(reason)
                )
              )
              .to.be.revertedWith("Address need to be registered to send funds");
      });

      describe("with registered address", async () => {
        let companyContract;
        let identificationDocument;
        let hashSignature;

        let amount = 10000;
        let hashDocument = "IPFS hash document";
        let category = "Category for fundRequest";
        let reason = "Reason for fundRequest";

        beforeEach(async () => {
          companyContract = contract.connect(companyWallet);
          identificationDocument = CNPJ.generate();
          hashSignature = "Signature message";
        
          await companyContract
                  .register(
                    companyWallet.address, 
                    identificationDocument,
                    utils.formatBytes32String(companyENS),
                    utils.formatBytes32String(hashSignature)
                  );

        });

        it("expect to emit a event ", async () => {
          await expect(companyContract
                .sendFundRequest(
                  companyWallet.address,
                  amount,
                  utils.formatBytes32String(hashDocument),
                  utils.formatBytes32String(category),
                  utils.formatBytes32String(reason)
                )
              )
              .to.emit(contract, 'FundRequestSend')
              .withArgs(
                companyWallet.address,
                1, 
                utils.formatBytes32String(reason)
              );
        });

        it("expect to save the fund request ", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendFundRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(category),
            utils.formatBytes32String(reason)
          );

          let [a,b,c,d,e,f] = await companyContract.getFundRequest(1);

          expect(a).to.eq(parseInt(amount));
          expect(b).to.eq(companyWallet.address);
          expect(c).to.eq(utils.formatBytes32String(hashDocument));
          expect(d).to.eq(utils.formatBytes32String(category));
          expect(e).to.eq(utils.formatBytes32String(reason));
          expect(f).to.eq(0); // this is the value related do "IN_ANALYSIS" on FundRequestStatus enum
        });

        it("expect to increase fundRequestCount ", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendFundRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(category),
            utils.formatBytes32String(reason)
          );

          let [a,b,c,d,e,f] = await companyContract.getFundRequest(1);

          expect(a).to.eq(parseInt(amount));
          expect(b).to.eq(companyWallet.address);
          expect(c).to.eq(utils.formatBytes32String(hashDocument));
          expect(d).to.eq(utils.formatBytes32String(category));
          expect(e).to.eq(utils.formatBytes32String(reason));
          expect(f).to.eq(0); // this is the value related do "IN_ANALYSIS" on FundRequestStatus enum
        });

         it("expect to be set on address fundRequestList", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendFundRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(category),
            utils.formatBytes32String(reason)
          );

          let [a,b,c,d] = await companyContract.getLPInfo(companyWallet.address);

          expect(a).to.eq(identificationDocument);
          expect(c).to.eq(utils.formatBytes32String(hashSignature));
          expect(d.length).to.eq(1);
          expect(d[0]).to.eq([1]);
          
        });
      });

    });

    describe("function sendRedemptionRequest", async () => {

      it("expect to revert if address is not registered", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await expect(companyContract
                .sendRedemptionRequest(
                  companyWallet.address,
                  amount,
                  utils.formatBytes32String(hashDocument),
                  utils.formatBytes32String(reason)
                )
              )
              .to.be.revertedWith("Address need to be registered to send redemptions");

      });

      describe("with registered address", async () => {
        let companyContract;
        let identificationDocument;
        let hashSignature;

        let amount = 10000;
        let hashDocument = "IPFS hash document";
        let category = "Category for fundRequest";
        let reason = "Reason for fundRequest";

        beforeEach(async () => {
          companyContract = contract.connect(companyWallet);
          identificationDocument = CNPJ.generate();
          hashSignature = "Signature message";
        
          await companyContract
                  .register(
                    companyWallet.address, 
                    identificationDocument,
                    utils.formatBytes32String(companyENS),
                    utils.formatBytes32String(hashSignature)
                  );

          await companyContract
                  .sendFundRequest(
                    companyWallet.address,
                    amount,
                    utils.formatBytes32String(hashDocument),
                    utils.formatBytes32String(category),
                    utils.formatBytes32String(reason)
                  );

          await contract.approveFundRequest(1);
          
        });

        it("expect to emit a event ", async () => {
          await expect(companyContract
                .sendRedemptionRequest(
                  companyWallet.address,
                  amount - 100,
                  utils.formatBytes32String(hashDocument),
                  utils.formatBytes32String(reason)
                )
              )
              .to.emit(contract, 'RedemptionRequestSend')
              .withArgs(
                companyWallet.address,
                1, 
                utils.formatBytes32String(reason)
              );
        });

        it("expect to save the redemption request ", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendRedemptionRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(reason)
          );

          let [a,b,c,d,e] = await companyContract.getRedemptionRequest(1);

          expect(a).to.eq(parseInt(amount));
          expect(b).to.eq(companyWallet.address);
          expect(c).to.eq(utils.formatBytes32String(hashDocument));
          expect(d).to.eq(utils.formatBytes32String(reason));
          expect(e).to.eq(0); // this is the value related do "IN_ANALYSIS" on FundRequestStatus enum
        });

        it("expect to increase redemptionRequestCount ", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendRedemptionRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(reason)
          );

          let count = await companyContract.getRedemptionRequestCount();

          expect(count).to.eq(1);
        });

        it("expect to be set on address redemptionRequestList", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendRedemptionRequest(
            companyWallet.address,
            amount,
            utils.formatBytes32String(hashDocument),
            utils.formatBytes32String(reason)
          );

          let [a,b,c,d,e] = await companyContract.getLPInfo(companyWallet.address);

          expect(a).to.eq(identificationDocument);
          expect(c).to.eq(utils.formatBytes32String(hashSignature));
          expect(parseInt(d[0])).to.eq(1);
          expect(parseInt(e[0])).to.eq(1);
        });

        it("expect to have a balance to request redemption", async () => {
          hashSignature = "Signature message";
          const amountExtra = amount + 10000;
          
          await expect(companyContract.sendRedemptionRequest(
              companyWallet.address,
              amountExtra,
              utils.formatBytes32String(hashDocument),
              utils.formatBytes32String(reason)
            )
          ).to.be.revertedWith("Address need to have balance to request redemption");
        });

        it("expect to reduce amount after send request redemption", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendRedemptionRequest(
              companyWallet.address,
              amount - 100,
              utils.formatBytes32String(hashDocument),
              utils.formatBytes32String(reason)
            )

          expect(
            await companyContract.balanceOf(companyWallet.address)
          ).to.eq(100);
        });

        it("expect to see amount on institutionAddress with amount after send request redemption", async () => {
          hashSignature = "Signature message";
          
          await companyContract.sendRedemptionRequest(
              companyWallet.address,
              amount - 100,
              utils.formatBytes32String(hashDocument),
              utils.formatBytes32String(reason)
            )

          expect(
            await companyContract.balanceOf(governWallet.address)
          ).to.eq(amount - 100);
        });


      });

    });  

    describe("function getFundRequest", async () => {

      it("expect to return a fundRequest ", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        let [a,b,c,d,e,f] = await companyContract.getFundRequest(1);

        expect(a).to.eq(parseInt(amount));
        expect(b).to.eq(companyWallet.address);
        expect(c).to.eq(utils.formatBytes32String(hashDocument));
        expect(d).to.eq(utils.formatBytes32String(category));
        expect(e).to.eq(utils.formatBytes32String(reason));
        expect(f).to.eq(0); // this is the value related do "IN_ANALYSIS" on FundRequestStatus enum
      });

    });

    describe("function getFundRequestCount", async () => {

      it("expect to be a function", async () => {
        expect(contract.getFundRequestCount).to.be.an('function');
      });

      it("expect to return the number of fund requests", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument, 
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        expect(
          await companyContract.getFundRequestCount()
        ).to.be.eq(1);
        
      });

    });

    describe("function getRedemptionRequestCount", async () => {

      it("expect to be a function", async () => {
        expect(contract.getRedemptionRequestCount).to.be.an('function');
      });

      it("expect to return the number of redemption requests", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await contract.mint(companyWallet.address, amount);

        await companyContract.sendRedemptionRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(reason)
        );

        expect(
          await companyContract.getRedemptionRequestCount()
        ).to.be.eq(1);
        
      });

    });

    describe("function approveFundRequest", async () => {

      it("expect to be a function", async () => {
        expect(contract.approveFundRequest).to.be.an('function');
      });

      it("expect to emit a event FundRequestApproved", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await expect(
            contract.approveFundRequest(1)
          )
          .to
          .emit(contract, "FundRequestApproved")
          .withArgs(
            companyWallet.address, 
            1, 
            utils.formatBytes32String(reason)
          );

      });

      it("expect to show status of fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.approveFundRequest(1);

         let [a,b,c,d,e,f] = await companyContract.getFundRequest(1);

        expect(a).to.eq(parseInt(amount));
        expect(b).to.eq(companyWallet.address);
        expect(c).to.eq(utils.formatBytes32String(hashDocument));
        expect(d).to.eq(utils.formatBytes32String(category));
        expect(e).to.eq(utils.formatBytes32String(reason));
        expect(f).to.eq(1); // this is the value related do "APPROVED" on FundRequestStatus enum
      });

      it("expect to revert if Fund Request not exists", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS), 
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await expect(
            contract.approveFundRequest(3)
          )
          .to.be.revertedWith("FundRequest not exists");

      });

      it("expect to not reapprove a fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.approveFundRequest(1)

        await expect(
          contract.approveFundRequest(1)
        )
        .to.be.revertedWith("FundRequest already approved");
      });

      it("expect to not approve a disapproved fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS), 
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.disapproveFundRequest(1)

        await expect(
          contract.approveFundRequest(1)
        ).to.be.revertedWith("FundRequest already disapproved");
      });

      it("expect to mint amount when aprove a fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.approveFundRequest(1)

        let balance = await companyContract.balanceOf(companyWallet.address)

        expect(balance).to.eq(amount);
      });

    });

    describe("function disapproveFundRequest", async () => {

      it("expect to be a function", async () => {
        expect(contract.disapproveFundRequest).to.be.an('function');
      });

      it("expect to emit a FundRequestDisapproved", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await expect(
            contract.disapproveFundRequest(1)
          )
          .to.emit(contract, "FundRequestDisapproved")
          .withArgs(
            companyWallet.address, 
            1, 
            utils.formatBytes32String(reason)
          );
        
      });

      it("expect to show status of fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.disapproveFundRequest(1);

         let [a,b,c,d,e,f] = await companyContract.getFundRequest(1);

        expect(a).to.eq(parseInt(amount));
        expect(b).to.eq(companyWallet.address);
        expect(c).to.eq(utils.formatBytes32String(hashDocument));
        expect(d).to.eq(utils.formatBytes32String(category));
        expect(e).to.eq(utils.formatBytes32String(reason));
        expect(f).to.eq(2); // this is the value related do "DISAPPROVED" on FundRequestStatus enum
      });

      it("expect to revert if Fund Request not exists", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await expect(
            contract.disapproveFundRequest(3)
          )
          .to.be.revertedWith("FundRequest not exists");
      });

      it("expect to not redisapprove a fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.disapproveFundRequest(1)

        await expect(
          contract.disapproveFundRequest(1)
        )
        .to.be.revertedWith("FundRequest already disapproved");
      });

      it("expect to not disapprove a approved fund request", async () => {
        const companyContract = contract.connect(companyWallet);
        const identificationDocument = CNPJ.generate();
        const hashSignature = "Signature message";
        const amount = 10000;
        const hashDocument = "IPFS hash document";
        const category = "Category for fundRequest";
        const reason = "Reason for fundRequest";

        await companyContract
                .register(
                  companyWallet.address,
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract.sendFundRequest(
          companyWallet.address,
          amount,
          utils.formatBytes32String(hashDocument),
          utils.formatBytes32String(category),
          utils.formatBytes32String(reason)
        );

        await contract.approveFundRequest(1)

        await expect(
          contract.disapproveFundRequest(1)
        )
        .to.be.revertedWith("FundRequest already approved");
      });

    });

    describe("function settleRedemptionRequest", async () => {

      it("expect to be a function", async () => {
        expect(contract.settleRedemptionRequest).to.be.an('function');
      });

      describe("with a registered company", async () => {
        let companyContract;  
        let identificationDocument = CNPJ.generate();
        let hashSignature = "Signature message";
        let amount = 10000;
        let hashDocument = "IPFS hash document";
        let category = "Category for fundRequest";
        let reason = "Reason for fundRequest";

        beforeEach(async () => {
          companyContract = contract.connect(companyWallet);
          
          await companyContract
                  .register(
                    companyWallet.address, 
                    identificationDocument,
                    utils.formatBytes32String(companyENS),
                    utils.formatBytes32String(hashSignature)
                  );

          await companyContract
                  .sendFundRequest(
                    companyWallet.address,
                    amount,
                    utils.formatBytes32String(hashDocument),
                    utils.formatBytes32String(category),
                    utils.formatBytes32String(reason)
                  );

          await contract.approveFundRequest(1);

          await companyContract
                  .sendRedemptionRequest(
                    companyWallet.address,
                    amount,
                    utils.formatBytes32String(hashDocument),
                    utils.formatBytes32String(reason)
                  );
          
        });


        it("expect to emit a RedemptionRequestSettle", async () => {
          
          await expect(
              contract.settleRedemptionRequest(1)
            )
            .to.emit(contract, "RedemptionRequestSettle")
            .withArgs(
              companyWallet.address, 
              1, 
              utils.formatBytes32String(reason)
            );
          
        });

        it("expect to revert if Redemption Request not exists", async () => {
        
          await expect(
            contract.settleRedemptionRequest(3)
          ).to.be.revertedWith("RedemptionRequest not exists");
        });

        it("expect to change a redemption request status", async () => {

          await contract.settleRedemptionRequest(1)

          let [a,b,c,d,e] = await companyContract.getRedemptionRequest(1);

          expect(e).to.eq(1); // this is the value related do "APPROVED" on FundRequestStatus enum
        });

        it("expect to not resettle a redemption request", async () => {
          await contract.settleRedemptionRequest(1)
          
          await expect(
            contract.settleRedemptionRequest(1)
          )
          .to.be.revertedWith("RedemptionRequest already approved");
        });

        it("expect to burn tokens after settleRedemptionRequest", async () => {
          await contract.settleRedemptionRequest(1)
          
          expect(
            await contract.balanceOf(governWallet.address)
          ).to.eq(0);
        });

      });

    });

  });

  describe("TRANSACTION FUNCTIONS", async() => {

     describe("function transferValue" , async() => {
      let companyContract;  
      let anotherCompanyContract;
      let identificationDocument = CNPJ.generate();
      let hashSignature = "Signature message";
      let amount = 10000;
      let hashDocument = "IPFS hash document";
      let category = "Category for fundRequest";
      let reason = "Reason for fundRequest";

      beforeEach(async () => {
        companyContract = contract.connect(companyWallet);
        
        await companyContract
                .register(
                  companyWallet.address, 
                  identificationDocument,
                  utils.formatBytes32String(companyENS),
                  utils.formatBytes32String(hashSignature)
                );

        await companyContract
                .sendFundRequest(
                  companyWallet.address,
                  amount,
                  utils.formatBytes32String(hashDocument),
                  utils.formatBytes32String(category),
                  utils.formatBytes32String(reason)
                );

        await contract.approveFundRequest(1);
      });


      it("expect to be a function", async () => {
        expect(contract.transferValue).to.be.an('function');
      });

      it("expect to acconut not transfer to him self", async () => {
        await expect(companyContract
          .transferValue(
            companyWallet.address,
            companyWallet.address,
            amount - 100 )
        ).to.be.revertedWith("Cannot transfer to himself");
      });

      it("expect to block direct transfer from govern to company", async () => {
        await expect(companyContract
          .transferValue(
            governWallet.address,
            companyWallet.address,
            amount - 100 )
        ).to.be.revertedWith("Cannot transfer from govern to company, should be make a fund request");
      });

      it("expect to block direct transfer from company to govern", async () => {
        await expect(companyContract
          .transferValue(
            companyWallet.address,
            governWallet.address,
            amount - 100 )
        ).to.be.revertedWith("Cannot transfer from company to govern, should be make a redemption request");
      });

      it("expect to block if sender is not registered", async () => {
        await expect(companyContract
          .transferValue(
            anotherCompanyWallet.address,
            companyWallet.address,
            amount - 100 )
        ).to.be.revertedWith("Cannot transfer if sender is not registered");
      });

      it("expect to block if receiver is not registered", async () => {
        await expect(companyContract
          .transferValue(
            companyWallet.address,
            anotherCompanyWallet.address,
            amount - 100 )
        ).to.be.revertedWith("Cannot transfer if receiver is not registered");
      });

      describe('when both companies is registered', async () => {

        beforeEach(async () => {
          anotherCompanyContract = contract.connect(anotherCompanyWallet);
          
          await anotherCompanyContract
                  .register(
                    anotherCompanyWallet.address, 
                    identificationDocument, 
                    utils.formatBytes32String(anotherCompanyENS),
                    utils.formatBytes32String(hashSignature)
                  );

          await anotherCompanyContract
                  .sendFundRequest(
                    anotherCompanyWallet.address,
                    amount,
                    utils.formatBytes32String(hashDocument),
                    utils.formatBytes32String(category),
                    utils.formatBytes32String(reason)
                  );

          await contract.approveFundRequest(2);
        });

        it("expect to move amount", async () => {
          await companyContract.transferValue(
            companyWallet.address,
            anotherCompanyWallet.address,
            amount - 100 )

          expect(
            await companyContract.balanceOf(companyWallet.address)
          ).to.eq(100);

          expect(
            await companyContract.balanceOf(anotherCompanyWallet.address)
          ).to.eq(2*amount - 100);
        });

        it("expect to emit a Transfer event", async () => {
          await expect(
            companyContract
              .transferValue(
                companyWallet.address,
                anotherCompanyWallet.address,
                amount - 100 
              )
            ).to.emit(contract, 'Transfer')
            .withArgs(
              companyWallet.address,
              anotherCompanyWallet.address,
              amount - 100
            );
        });

        it("expect to emit a CompanyTransfer event", async () => {
          await expect(
            companyContract
              .transferValue(
                companyWallet.address,
                anotherCompanyWallet.address,
                amount - 100 
              )
            ).to.emit(contract, 'CompanyTransfer')
            .withArgs(
              identificationDocument,
              identificationDocument,
              amount - 100
            );
        });

      })
     
    });

  });
  
});
