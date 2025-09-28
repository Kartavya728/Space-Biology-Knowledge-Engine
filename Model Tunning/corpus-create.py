from google.ai.generativelanguage_v1beta import RetrieverServiceClient, CreateCorpusRequest, Corpus

client = RetrieverServiceClient()

project_id = "sustained-works-470816-b6"
corpus_id = "space-biology"  # short, lowercase, no spaces
parent = f"projects/{project_id}/locations/global"

corpus = client.create_corpus(
    request=CreateCorpusRequest(
        parent=parent,
        corpus=Corpus(
            display_name="Space Biology Research",
            description="Corpus for microgravity & stem cell studies"
        ),
        corpus_id=corpus_id
    )
)

print("✅ Created corpus:", corpus.name)
# e.g., projects/123456/locations/global/corpora/space-biology
