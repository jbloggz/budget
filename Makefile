#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# Makefile: The recipies for building the budget app
#

.PHONY: test coverage coverage_html clean

test:
	rm -f backend/budget-test.db*
	cd backend && DB_PATH="budget-test.db" python3 api.test.py
	rm -f backend/budget-test.db*

coverage:
	rm -f backend/budget-test.db*
	cd backend && DB_PATH="budget-test.db" python3 -m coverage run --branch --source=. api.test.py
	cd backend && python3 -m coverage report
	rm -f backend/budget-test.db*

coverage_html: coverage
	cd backend && python3 -m coverage html

clean:
	rm -f backend/budget-test.db*
	rm -f backend/.coverage
	rm -rf backend/htmlcov
	rm -rf .mypy_cache