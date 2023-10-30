#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# Makefile: The recipies for building the budget app
#

.PHONY: default test build lint coverage coverage_html serve clean

default: build

test:
	rm -f backend/budget-test.db*
	cd backend && DB_PATH="budget-test.db" python3 api.test.py
	cd backend && DB_PATH="budget-test.db" python3 insert_transactions.test.py
	rm -f backend/budget-test.db*
	node_modules/.bin/vitest run test

coverage:
	rm -f backend/budget-test.db*
	cd backend && DB_PATH="budget-test.db" python3 -m coverage run -p --branch --source=. api.test.py
	cd backend && DB_PATH="budget-test.db" python3 -m coverage run -p --branch --source=. insert_transactions.test.py
	cd backend && python3 -m coverage combine
	cd backend && python3 -m coverage html
	rm -f backend/budget-test.db*
	node_modules/.bin/vitest run --coverage

scrape:
	cd backend && python3 insert_transactions.py --log budget.log --config budget.json

build:
	npm run build

lint:
	npm run lint

serve:
	node_modules/.bin/concurrently "cd backend && uvicorn api:app --reload" "node_modules/.bin/vite --host"

clean:
	rm -f backend/budget-test.db*
	rm -f backend/.coverage
	rm -rf coverage
	rm -rf backend/htmlcov
	rm -rf .mypy_cache
	rm -rf dist

clean-all: clean
	rm -rf node_modules

