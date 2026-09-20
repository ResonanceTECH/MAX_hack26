from dotenv import load_dotenv

from api.max_api import MaxAPI

load_dotenv()

if __name__ == "__main__":
    print(MaxAPI().get_me())
