import { ref } from 'firebase/storage';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval"
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever"
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "@/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { describeIndexStats } from '@pinecone-database/pinecone/dist/data/describeIndexStats';


auth
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "gemini-1.5-pro"
})

export const indexName = "pdf-buddy"

async function fetchMessagesFromDB(docId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("user not found")
    }
    console.log("---- Fetching chat history from firestore database----");
    const chats = await adminDb
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(docId)
        .collection("chat")
        .orderBy("createdAt", "desc")
        .get();
    
    const chatHistory = chats.docs.map((doc) =>
        doc.data().role === "human"
            ? new HumanMessage(doc.data().message)
            : new AIMessage(doc.data().message)
    )

    console.log(`---- fetched last ${chatHistory.length} messages successfully----`)

    console.log(chatHistory.map((msg) => msg.content.toString()));
    return chatHistory;
    
}

export async function generateDocs(docId:string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("user not found")
    }
    console.log("----Fetch the download URL from firebase...----");
    const firebaseRef = await adminDb
        .collection("users")
        .doc(userId)
        .collection("files")
        .doc(docId)
        .get()
    
    const downloadUrl = firebaseRef.data()?.downloadUrl;

    if (!downloadUrl) {
        throw new Error("Download URL not found");
    }

    console.log(`Download URL fetched successfully: ${downloadUrl}`)
    const response = await fetch(downloadUrl);

    const data = await response.blob();

    console.log("Loading PDF Document...")
    const loader = new PDFLoader(data);
    const docs = await loader.load();

    console.log("Splitting documents into smaller parts...")
    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`Split into ${splitDocs.length} parts`)

    return splitDocs;
}

async function namespaceExists(index:Index<RecordMetadata>, namespace: string) {
    if (namespace === null) throw new Error("No namespace value provided.");
    const { namespaces } = await index.describeIndexStats();
    return namespaces?.[namespace] !== undefined;
}

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not found");
    }

    let pineconeVectorStore;

    // generating embeddings for split document
    console.log("----Generating Embedding-----")
    const embeddings = new GoogleGenerativeAIEmbeddings();

    const index = await pineconeClient.index(indexName);
    const namespaceAlreadyExists = await namespaceExists(index, docId)

    if (namespaceAlreadyExists) {
        console.log(`----Namespace ${docId} already exists, reusing existing embeddings...----`)
        pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: docId,
        });
    
        return pineconeVectorStore

    } else {
        const splitDocs = await generateDocs(docId)
        
        console.log(`Storing the embeddings in namespace ${docId} in the ${indexName} Pinecone vector store.`);
        
        pineconeVectorStore = await PineconeStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                pineconeIndex: index,
                namespace: docId
            }
        );
        return pineconeVectorStore;
    }

}

const generateLangchainCompletion = async (docId: string, question: string) => {
    let pineconeVectorStore;

    pineconeVectorStore = await generateEmbeddingsInPineconeVectorStore(docId)
    if (!pineconeVectorStore) {
        throw new Error("Pinecone vector store not found");
        }

    console.log('====================================')
    console.log("--- Creating a retriever... ---")
    console.log('====================================')

    const retriever = pineconeVectorStore.asRetriever();

    // Fetch chat history from the database
    const chatHistory = await fetchMessagesFromDB(docId);

    // Define a prompt template for generating search queries based on conversation history
    console.log("--- Defining a prompt template... ---");
    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
        ...chatHistory,
        ["user", "{input}"],
        [
            "user",
            "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation"
        ],
    ]);
    // Create a history-aware retriever chain that uses the model, retriever, and prompt
    console.log("--- Creating a history-aware retriever chain... ---");
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
        llm: model,
        retriever,
        rephrasePrompt: historyAwarePrompt,
    });

    //Define a prompt template for answering questions based on retrieved  context
    console.log('====================================')
    console.log("Defining a prompt template for answering questions")
    console.log('====================================')
    const historyAwareRetrieverPrompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "Answer the user's questions based on the below context:\n\n{context}"
        ],

        ...chatHistory, //Insert actual chat history here
        ["user", "{input}"],
    ]);


    // creating a chain to combine the retrieved documents into a coherent response
    console.log("---- Creating a document combining chain...----");
    const historyAwareCombineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt: historyAwareRetrieverPrompt
    });

    // create the main retrieval chain that combines the history-aware retriever and document combining chains
    console.log("--- Creating the main retrieval chain... ----");
    const conversationalRetrievalChain = await createRetrievalChain({
        retriever: historyAwareRetrieverChain,
        combineDocsChain: historyAwareCombineDocsChain
    });

    console.log("--- Running the chain with a sample conversation...")
        const reply = await conversationalRetrievalChain.invoke({
        chat_history: chatHistory,
        input: question,
        });
    
    console.log(reply.answer);
    return reply.answer;
    

}

export {model, generateLangchainCompletion}