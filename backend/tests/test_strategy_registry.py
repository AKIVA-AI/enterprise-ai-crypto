from app.services.strategy_registry import StrategyRegistry


class DummyStrategy:
    pass


def test_register_and_get_strategy():
    registry = StrategyRegistry()
    registered = registry.register_strategy(
        strategy_class=DummyStrategy,
        name="TestStrategy",
        description="Example strategy",
        parameters={"lookback": 14},
    )

    assert registered.name == "TestStrategy"
    assert registered.parameters["lookback"] == 14

    fetched = registry.get_strategy("TestStrategy")
    assert fetched is not None
    assert fetched.strategy_class is DummyStrategy


def test_list_strategies():
    registry = StrategyRegistry()
    registry.register_strategy(DummyStrategy, name="One")
    registry.register_strategy(DummyStrategy, name="Two")

    listed = registry.list_strategies(include_config=False, include_runtime=True)
    names = {meta.name for meta in listed}
    assert names == {"One", "Two"}


def test_register_duplicate_raises():
    registry = StrategyRegistry()
    registry.register_strategy(DummyStrategy, name="Dup")

    try:
        registry.register_strategy(DummyStrategy, name="Dup")
        assert False, "Expected ValueError for duplicate strategy"
    except ValueError:
        assert True
