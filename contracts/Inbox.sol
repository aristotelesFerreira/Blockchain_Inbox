pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract Inbox {
    struct Message {
        uint256 id;
        string message;
        address from;
        address to;
        uint256 value;
    }
    //Structure
    mapping(string => string) public ipfsInbox;
    mapping(address => Message) public messageAddress;

    //Events
    event ipfsSent(string _ipfsHash, string _address);
    event messageSend(address from, address to, string message);
    event inboxResponse(string response);

    address public minter;

    //Modifiers
    modifier notFull(string memory _string) {
        bytes memory stringTest = bytes(_string);
        require(stringTest.length == 0);
        _;
    }

    // An empty constructor that creates an instance of the conteact
    constructor() public {
        minter = msg.sender;
    }

    //takes in receiver's address and IPFS hash. Places the IPFSadress in the receiver's inbox
    function sendIPFS(string memory _address, string memory _ipfsHash)
        public
        notFull(ipfsInbox[_address])
    {
        ipfsInbox[_address] = _ipfsHash;
        emit ipfsSent(_ipfsHash, _address);
    }

    //retrieves hash
    function getHash(string memory _address)
        public
        view
        returns (string memory)
    {
        string memory ipfs_hash = ipfsInbox[_address];
        //emit inboxResponse(ipfs_hash);
        return ipfs_hash;
    }

    function setMessage(Message memory message) public {
        require(msg.sender == minter, "Only owners can be send message");
        messageAddress[message.to] = message;
        emit messageSend(message.from, message.to, message.message);
    }

    function getMessage(address received) public view returns (Message memory) {
        require(received == msg.sender, "Not permissions");
        Message memory message = messageAddress[received];
        return message;
    }
}
