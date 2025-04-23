// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    struct Document {
        bytes32 documentId;
        string ipfsHash;
        address uploader;
        uint256 timestamp;
    }

    // Mapping from document ID to Document struct
    mapping(bytes32 => Document) public documents;
    
    // Event emitted when a new document is uploaded
    event DocumentUploaded(
        bytes32 indexed documentId,
        string ipfsHash,
        address indexed uploader,
        uint256 timestamp
    );

    function uploadDocument(bytes32 documentId, string memory ipfsHash) public {
        require(documents[documentId].timestamp == 0, "Document already exists");
        
        documents[documentId] = Document({
            documentId: documentId,
            ipfsHash: ipfsHash,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit DocumentUploaded(
            documentId,
            ipfsHash,
            msg.sender,
            block.timestamp
        );
    }

    function getDocument(bytes32 documentId) public view returns (
        string memory ipfsHash,
        address uploader,
        uint256 timestamp
    ) {
        Document memory doc = documents[documentId];
        require(doc.timestamp != 0, "Document does not exist");
        
        return (
            doc.ipfsHash,
            doc.uploader,
            doc.timestamp
        );
    }
} 