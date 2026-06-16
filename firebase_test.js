import { db, auth } from "./src/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

async function test() {
  try {
    console.log("Testing Firestore...");
    const testDoc = doc(db, "test_collection", "test1");
    await setDoc(testDoc, { hello: "world" });
    console.log("Write success.");

    const q = collection(db, "test_collection");
    const snapshot = await getDocs(q);
    console.log("Read success. Doc count:", snapshot.size);
    snapshot.forEach(d => console.log(d.data()));
    process.exit(0);
  } catch(e) {
    console.error("Firestore test failed:", e);
    process.exit(1);
  }
}

test();
